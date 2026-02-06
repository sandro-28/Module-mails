import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiResponse,
  apiError,
  authenticateApiKey,
  isErrorResponse,
} from '@/lib/api/helpers'

// GET /api/v1/analytics/overview — global analytics overview
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const url = new URL(request.url)
  const period = url.searchParams.get('period') ?? '30d'

  // Calculate date range
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[period] ?? 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createAdminClient()

  // Get campaigns sent in the period
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('stats, total_recipients, status')
    .eq('organization_id', auth.organizationId)
    .gte('sending_started_at', since)
    .in('status', ['sent', 'sending'])

  let totalSent = 0
  let totalDelivered = 0
  let totalOpened = 0
  let totalClicked = 0
  let totalBounced = 0
  let totalComplaints = 0
  let totalUnsubscribed = 0
  let campaignCount = 0

  for (const campaign of campaigns ?? []) {
    const stats = campaign.stats as Record<string, number> | null
    if (!stats) continue
    campaignCount++
    totalSent += stats.sent ?? 0
    totalDelivered += stats.delivered ?? 0
    totalOpened += stats.unique_opens ?? 0
    totalClicked += stats.unique_clicks ?? 0
    totalBounced += stats.bounced ?? 0
    totalComplaints += stats.complained ?? 0
    totalUnsubscribed += stats.unsubscribed ?? 0
  }

  const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
  const avgClickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0
  const avgBounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
  const avgComplaintRate = totalDelivered > 0 ? (totalComplaints / totalDelivered) * 100 : 0

  // Get total contacts
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', auth.organizationId)
    .eq('status', 'active')

  // Get new contacts in period
  const { count: newContacts } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', auth.organizationId)
    .gte('created_at', since)

  return apiResponse({
    period,
    campaigns_sent: campaignCount,
    total_sent: totalSent,
    total_delivered: totalDelivered,
    total_opened: totalOpened,
    total_clicked: totalClicked,
    total_bounced: totalBounced,
    total_complaints: totalComplaints,
    total_unsubscribed: totalUnsubscribed,
    avg_open_rate: Math.round(avgOpenRate * 100) / 100,
    avg_click_rate: Math.round(avgClickRate * 100) / 100,
    avg_bounce_rate: Math.round(avgBounceRate * 100) / 100,
    avg_complaint_rate: Math.round(avgComplaintRate * 100) / 100,
    total_active_contacts: totalContacts ?? 0,
    new_contacts: newContacts ?? 0,
  })
}
