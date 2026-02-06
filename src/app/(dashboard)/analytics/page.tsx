import { createClient } from "@/lib/supabase/server"
import { AnalyticsClient } from "./analytics-client"

export const metadata = {
  title: "Analytics | MailForge",
  description: "Email marketing analytics and insights",
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get the user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) {
    return null
  }

  const orgId = membership.organization_id

  // Fetch aggregated data in parallel
  const [
    { count: totalContacts },
    { data: campaigns },
    { data: recentEvents },
    { data: contactGrowth },
    { data: contactSources },
  ] = await Promise.all([
    // Total contacts
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),

    // Campaigns with stats
    supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", orgId)
      .in("status", ["sent", "sending"])
      .order("created_at", { ascending: false })
      .limit(50),

    // Recent email events for time-series (last 90 days)
    supabase
      .from("email_events")
      .select("*")
      .eq("organization_id", orgId)
      .gte("timestamp", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: true })
      .limit(10000),

    // Contact growth - contacts grouped by creation date
    supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", orgId)
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true })
      .limit(10000),

    // Contact sources
    supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", orgId)
      .not("source", "is", null)
      .limit(10000),
  ])

  // Aggregate campaign stats
  let totalSent = 0
  let totalOpened = 0
  let totalClicked = 0
  let totalBounced = 0
  let totalUnsubscribed = 0
  let campaignCount = 0

  const campaignList = (campaigns ?? []).map((c) => {
    const stats = c.stats as Record<string, number> | null
    if (stats) {
      totalSent += stats.sent ?? 0
      totalOpened += stats.unique_opens ?? 0
      totalClicked += stats.unique_clicks ?? 0
      totalBounced += stats.bounced ?? 0
      totalUnsubscribed += stats.unsubscribed ?? 0
      campaignCount++
    }
    return c
  })

  const avgOpenRate =
    campaignCount > 0 && totalSent > 0
      ? (totalOpened / totalSent) * 100
      : 0
  const avgClickRate =
    campaignCount > 0 && totalSent > 0
      ? (totalClicked / totalSent) * 100
      : 0
  const avgBounceRate =
    campaignCount > 0 && totalSent > 0
      ? (totalBounced / totalSent) * 100
      : 0
  const avgUnsubscribeRate =
    campaignCount > 0 && totalSent > 0
      ? (totalUnsubscribed / totalSent) * 100
      : 0

  // Build time-series data from events
  const eventsByDate: Record<string, { sent: number; opened: number; clicked: number }> = {}
  for (const event of recentEvents ?? []) {
    const date = event.timestamp.split("T")[0]
    if (!eventsByDate[date]) {
      eventsByDate[date] = { sent: 0, opened: 0, clicked: 0 }
    }
    if (event.event_type === "sent" || event.event_type === "delivered") {
      eventsByDate[date].sent++
    } else if (event.event_type === "opened") {
      eventsByDate[date].opened++
    } else if (event.event_type === "clicked") {
      eventsByDate[date].clicked++
    }
  }

  const timeSeriesData = Object.entries(eventsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      ...counts,
    }))

  // Top 5 campaigns by open rate
  const topCampaigns = campaignList
    .filter((c) => {
      const s = c.stats as Record<string, number> | null
      return s && (s.sent ?? 0) > 0
    })
    .map((c) => {
      const s = c.stats as Record<string, number>
      return {
        name: c.name,
        openRate: ((s.unique_opens ?? 0) / (s.sent ?? 1)) * 100,
        clickRate: ((s.unique_clicks ?? 0) / (s.sent ?? 1)) * 100,
        sent: s.sent ?? 0,
      }
    })
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 5)

  // Contact growth data
  const growthByMonth: Record<string, number> = {}
  for (const contact of contactGrowth ?? []) {
    const month = contact.created_at.slice(0, 7) // YYYY-MM
    growthByMonth[month] = (growthByMonth[month] ?? 0) + 1
  }

  let cumulativeCount = 0
  const contactGrowthData = Object.entries(growthByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      cumulativeCount += count
      return {
        month,
        newContacts: count,
        totalContacts: cumulativeCount,
      }
    })

  // Source breakdown
  const sourceCounts: Record<string, number> = {}
  for (const contact of contactSources ?? []) {
    const source = contact.source ?? "Unknown"
    sourceCounts[source] = (sourceCounts[source] ?? 0) + 1
  }

  const sourceBreakdown = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Device breakdown from event metadata
  const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 }
  for (const event of recentEvents ?? []) {
    if (event.metadata && typeof event.metadata === "object") {
      const deviceType = (event.metadata as Record<string, unknown>).device_type
      if (typeof deviceType === "string" && deviceType in deviceCounts) {
        deviceCounts[deviceType]++
      }
    }
  }
  const deviceBreakdown = Object.entries(deviceCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  return (
    <AnalyticsClient
      kpis={{
        totalSent,
        avgOpenRate,
        avgClickRate,
        avgBounceRate,
        avgUnsubscribeRate,
        totalContacts: totalContacts ?? 0,
      }}
      timeSeriesData={timeSeriesData}
      topCampaigns={topCampaigns}
      contactGrowthData={contactGrowthData}
      sourceBreakdown={sourceBreakdown}
      deviceBreakdown={deviceBreakdown}
    />
  )
}
