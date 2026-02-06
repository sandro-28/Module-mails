import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'
import type { CampaignStats } from '@/types/database'

type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained'

interface ResendWebhookPayload {
  type: ResendEventType
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    click?: { link: string }
    bounce?: { type: string; message: string }
    complaint?: { feedback_type: string }
    [key: string]: unknown
  }
}

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  return signature === expected
}

// POST /api/webhooks/resend — receive Resend webhook events
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('svix-signature') ?? request.headers.get('x-resend-signature')
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: ResendWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Find the campaign_email by provider_id (Resend email_id)
  const { data: campaignEmail } = await supabase
    .from('campaign_emails')
    .select('id, campaign_id, contact_id, email_address, first_opened_at, first_clicked_at, open_count, click_count')
    .eq('provider_id', payload.data.email_id)
    .single()

  if (!campaignEmail) {
    // Not a tracked email — acknowledge receipt anyway
    return NextResponse.json({ received: true })
  }

  // Get org_id from campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('organization_id, stats, total_recipients')
    .eq('id', campaignEmail.campaign_id)
    .single()

  if (!campaign) {
    return NextResponse.json({ received: true })
  }

  const eventTypeMap: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
  }

  const eventType = eventTypeMap[payload.type]
  if (!eventType) {
    return NextResponse.json({ received: true })
  }

  // Create email event
  await supabase.from('email_events').insert({
    organization_id: campaign.organization_id,
    campaign_id: campaignEmail.campaign_id,
    campaign_email_id: campaignEmail.id,
    contact_id: campaignEmail.contact_id,
    email_address: campaignEmail.email_address,
    event_type: eventType as 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained',
    message_id: payload.data.email_id,
    timestamp: now,
    metadata: {
      provider: 'resend',
      link_url: payload.data.click?.link,
      bounce_type: payload.data.bounce?.type as import('@/types/database').BounceType | undefined,
      bounce_message: payload.data.bounce?.message,
      complaint_feedback_type: payload.data.complaint?.feedback_type,
    },
  })

  // Update campaign_emails status based on event type
  const statusUpdates: Record<string, unknown> = { updated_at: now }

  switch (payload.type) {
    case 'email.sent':
      statusUpdates.status = 'sent'
      statusUpdates.sent_at = now
      break
    case 'email.delivered':
      statusUpdates.status = 'delivered'
      statusUpdates.delivered_at = now
      break
    case 'email.opened':
      if (!campaignEmail.first_opened_at) {
        statusUpdates.first_opened_at = now
      }
      statusUpdates.last_opened_at = now
      statusUpdates.open_count = (campaignEmail.open_count ?? 0) + 1
      statusUpdates.status = 'opened'
      break
    case 'email.clicked':
      if (!campaignEmail.first_clicked_at) {
        statusUpdates.first_clicked_at = now
      }
      statusUpdates.last_clicked_at = now
      statusUpdates.click_count = (campaignEmail.click_count ?? 0) + 1
      statusUpdates.status = 'clicked'
      break
    case 'email.bounced': {
      statusUpdates.status = 'bounced'
      statusUpdates.bounced_at = now
      const bounceType = payload.data.bounce?.type === 'hard' ? 'hard' : 'soft'
      statusUpdates.bounce_type = bounceType
      statusUpdates.bounce_message = payload.data.bounce?.message ?? null

      // Update contact status
      if (campaignEmail.contact_id) {
        const contactUpdate: Record<string, unknown> = {
          bounced_at: now,
          emails_bounced: 1, // This would ideally increment
          updated_at: now,
        }
        if (bounceType === 'hard') {
          contactUpdate.status = 'bounced'
        }
        await supabase
          .from('contacts')
          .update(contactUpdate)
          .eq('id', campaignEmail.contact_id)

        // Add to suppression list on hard bounce
        if (bounceType === 'hard') {
          await supabase.from('suppression_list').upsert(
            {
              organization_id: campaign.organization_id,
              email_address: campaignEmail.email_address,
              email_hash: campaignEmail.email_address, // simplified
              reason: 'hard_bounce',
              bounce_type: 'hard',
              bounce_code: payload.data.bounce?.message ?? null,
              campaign_id: campaignEmail.campaign_id,
              source: 'resend_webhook',
            },
            { onConflict: 'organization_id,email_hash' },
          )
        }
      }
      break
    }
    case 'email.complained': {
      statusUpdates.status = 'complained'
      statusUpdates.complained_at = now

      // Update contact status
      if (campaignEmail.contact_id) {
        await supabase
          .from('contacts')
          .update({
            status: 'complained',
            complained_at: now,
            updated_at: now,
          })
          .eq('id', campaignEmail.contact_id)

        // Add to suppression list
        await supabase.from('suppression_list').upsert(
          {
            organization_id: campaign.organization_id,
            email_address: campaignEmail.email_address,
            email_hash: campaignEmail.email_address,
            reason: 'complaint',
            complaint_feedback_type: payload.data.complaint?.feedback_type ?? null,
            campaign_id: campaignEmail.campaign_id,
            source: 'resend_webhook',
          },
          { onConflict: 'organization_id,email_hash' },
        )
      }
      break
    }
  }

  await supabase
    .from('campaign_emails')
    .update(statusUpdates)
    .eq('id', campaignEmail.id)

  // Update campaign aggregate stats
  const stats = (campaign.stats ?? {}) as Record<string, number>
  switch (payload.type) {
    case 'email.sent':
      stats.sent = (stats.sent ?? 0) + 1
      break
    case 'email.delivered':
      stats.delivered = (stats.delivered ?? 0) + 1
      break
    case 'email.bounced':
      stats.bounced = (stats.bounced ?? 0) + 1
      if (payload.data.bounce?.type === 'hard') {
        stats.hard_bounced = (stats.hard_bounced ?? 0) + 1
      } else {
        stats.soft_bounced = (stats.soft_bounced ?? 0) + 1
      }
      break
    case 'email.complained':
      stats.complained = (stats.complained ?? 0) + 1
      break
  }

  // Recompute rates
  const total = campaign.total_recipients || 1
  const delivered = stats.delivered ?? 0
  stats.bounce_rate = total > 0 ? ((stats.bounced ?? 0) / total) * 100 : 0
  stats.complaint_rate = delivered > 0 ? ((stats.complained ?? 0) / delivered) * 100 : 0

  await supabase
    .from('campaigns')
    .update({ stats: stats as unknown as CampaignStats, updated_at: now })
    .eq('id', campaignEmail.campaign_id)

  return NextResponse.json({ received: true })
}
