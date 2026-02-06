import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UAParser } from 'ua-parser-js'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /track/click/:id?e=campaign_email_id&url=original_url
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: trackingCode } = await params
  const url = new URL(request.url)
  const campaignEmailId = url.searchParams.get('e') ?? undefined
  const originalUrl = url.searchParams.get('url') ?? '/'

  // Always redirect — tracking must never fail visibly
  const redirect = () => NextResponse.redirect(originalUrl, 301)

  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Parse user-agent
    const userAgentString = request.headers.get('user-agent') ?? ''
    const parser = new UAParser(userAgentString)
    const device = parser.getDevice()
    const browser = parser.getBrowser()
    const os = parser.getOS()
    const rawDeviceType = device.type ?? 'desktop'
    const deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' =
      rawDeviceType === 'mobile' || rawDeviceType === 'tablet' ? rawDeviceType : rawDeviceType === 'desktop' ? 'desktop' : 'unknown'

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
    const referer = request.headers.get('referer') ?? undefined

    // Find the tracked link
    const { data: trackedLink } = await supabase
      .from('tracked_links')
      .select('id, campaign_id, original_url, total_clicks, unique_clicks')
      .eq('tracking_code', trackingCode)
      .single()

    if (!trackedLink) {
      return redirect()
    }

    // Get campaign info for org_id
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('organization_id')
      .eq('id', trackedLink.campaign_id)
      .single()

    // Get campaign email info
    let campaignEmail: {
      id: string
      contact_id: string | null
      email_address: string
      first_clicked_at: string | null
      click_count: number
    } | null = null

    if (campaignEmailId) {
      const { data } = await supabase
        .from('campaign_emails')
        .select('id, contact_id, email_address, first_clicked_at, click_count')
        .eq('id', campaignEmailId)
        .single()
      campaignEmail = data
    }

    // Record link click
    await supabase.from('link_clicks').insert({
      tracked_link_id: trackedLink.id,
      campaign_email_id: campaignEmailId ?? null,
      contact_id: campaignEmail?.contact_id ?? null,
      user_agent: userAgentString || null,
      ip_address: ip ?? null,
      device_type: deviceType,
      browser: browser.name ?? null,
      os: os.name ?? null,
      referer: referer ?? null,
      clicked_at: now,
    })

    // Record email event
    if (campaign && campaignEmail) {
      await supabase.from('email_events').insert({
        organization_id: campaign.organization_id,
        campaign_id: trackedLink.campaign_id,
        campaign_email_id: campaignEmail.id,
        contact_id: campaignEmail.contact_id,
        email_address: campaignEmail.email_address,
        event_type: 'clicked',
        timestamp: now,
        metadata: {
          link_url: trackedLink.original_url,
          link_id: trackedLink.id,
          user_agent: userAgentString,
          ip_address: ip,
          device_type: deviceType,
          browser: browser.name,
          os: os.name,
        },
      })
    }

    // Update campaign_emails
    if (campaignEmail) {
      const isFirstClick = !campaignEmail.first_clicked_at
      await supabase
        .from('campaign_emails')
        .update({
          first_clicked_at: isFirstClick ? now : campaignEmail.first_clicked_at,
          last_clicked_at: now,
          click_count: (campaignEmail.click_count ?? 0) + 1,
          device_type: deviceType,
          updated_at: now,
        })
        .eq('id', campaignEmail.id)

      // Update contact stats on first click
      if (isFirstClick && campaignEmail.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('emails_clicked')
          .eq('id', campaignEmail.contact_id)
          .single()

        if (contact) {
          await supabase
            .from('contacts')
            .update({
              last_email_clicked_at: now,
              emails_clicked: (contact.emails_clicked ?? 0) + 1,
              last_activity_at: now,
              updated_at: now,
            })
            .eq('id', campaignEmail.contact_id)
        }
      }
    }

    // Update tracked_links stats
    // Check if this is a unique click (first click from this campaign_email)
    const isUniqueClick = campaignEmail && !campaignEmail.first_clicked_at
    await supabase
      .from('tracked_links')
      .update({
        total_clicks: (trackedLink.total_clicks ?? 0) + 1,
        unique_clicks: (trackedLink.unique_clicks ?? 0) + (isUniqueClick ? 1 : 0),
        last_clicked_at: now,
      })
      .eq('id', trackedLink.id)

    // Update campaign stats
    if (campaign && campaignEmail && !campaignEmail.first_clicked_at) {
      const { data: campaignRow } = await supabase
        .from('campaigns')
        .select('stats, total_recipients')
        .eq('id', trackedLink.campaign_id)
        .single()

      if (campaignRow) {
        const stats = (campaignRow.stats ?? {}) as Record<string, number>
        stats.clicked = (stats.clicked ?? 0) + 1
        stats.unique_clicks = (stats.unique_clicks ?? 0) + 1
        const delivered = stats.delivered ?? campaignRow.total_recipients ?? 1
        stats.click_rate = delivered > 0 ? ((stats.unique_clicks ?? 0) / delivered) * 100 : 0

        await supabase
          .from('campaigns')
          .update({ stats: stats as unknown as import('@/types/database').CampaignStats, updated_at: now })
          .eq('id', trackedLink.campaign_id)
      }
    }
  } catch {
    // Silently swallow errors — tracking must not fail
  }

  return redirect()
}
