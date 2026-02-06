import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /track/open/:id — record open event and return tracking pixel
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: campaignEmailId } = await params

  // Always return the pixel regardless of errors — tracking must never fail visibly
  const pixelResponse = () =>
    new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': TRANSPARENT_GIF.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })

  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Fetch campaign_email record
    const { data: campaignEmail } = await supabase
      .from('campaign_emails')
      .select('id, campaign_id, contact_id, email_address, first_opened_at, open_count')
      .eq('id', campaignEmailId)
      .single()

    if (!campaignEmail) {
      return pixelResponse()
    }

    // Parse user-agent for metadata
    const userAgent = request.headers.get('user-agent') ?? undefined
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined

    // Record email event
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('organization_id')
      .eq('id', campaignEmail.campaign_id)
      .single()

    if (campaign) {
      await supabase.from('email_events').insert({
        organization_id: campaign.organization_id,
        campaign_id: campaignEmail.campaign_id,
        campaign_email_id: campaignEmail.id,
        contact_id: campaignEmail.contact_id,
        email_address: campaignEmail.email_address,
        event_type: 'opened',
        timestamp: now,
        metadata: {
          user_agent: userAgent,
          ip_address: ip,
        },
      })
    }

    // Update campaign_emails record
    const isFirstOpen = !campaignEmail.first_opened_at
    await supabase
      .from('campaign_emails')
      .update({
        first_opened_at: isFirstOpen ? now : campaignEmail.first_opened_at,
        last_opened_at: now,
        open_count: (campaignEmail.open_count ?? 0) + 1,
        user_agent: userAgent ?? null,
        ip_address: ip ?? null,
        updated_at: now,
      })
      .eq('id', campaignEmail.id)

    // Update contact stats
    if (campaignEmail.contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('emails_opened')
        .eq('id', campaignEmail.contact_id)
        .single()

      if (contact && isFirstOpen) {
        await supabase
          .from('contacts')
          .update({
            last_email_opened_at: now,
            emails_opened: (contact.emails_opened ?? 0) + 1,
            last_activity_at: now,
            updated_at: now,
          })
          .eq('id', campaignEmail.contact_id)
      }
    }

    // Update campaign stats: increment unique_opens on first open only
    if (campaign && isFirstOpen) {
      const { data: campaignRow } = await supabase
        .from('campaigns')
        .select('stats, total_recipients')
        .eq('id', campaignEmail.campaign_id)
        .single()

      if (campaignRow) {
        const stats = (campaignRow.stats ?? {}) as Record<string, number>
        stats.opened = (stats.opened ?? 0) + 1
        stats.unique_opens = (stats.unique_opens ?? 0) + 1
        const delivered = stats.delivered ?? campaignRow.total_recipients ?? 1
        stats.open_rate = delivered > 0 ? ((stats.unique_opens ?? 0) / delivered) * 100 : 0

        await supabase
          .from('campaigns')
          .update({ stats: stats as unknown as import('@/types/database').CampaignStats, updated_at: now })
          .eq('id', campaignEmail.campaign_id)
      }
    }
  } catch {
    // Silently swallow errors — tracking must not fail
  }

  return pixelResponse()
}
