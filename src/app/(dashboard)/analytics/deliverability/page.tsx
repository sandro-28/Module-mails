import { createClient } from "@/lib/supabase/server"
import { DeliverabilityClient } from "./deliverability-client"

export const metadata = {
  title: "Deliverability | MailForge",
  description: "Email deliverability monitoring and insights",
}

export default async function DeliverabilityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) return null

  const orgId = membership.organization_id

  // Fetch organization for domain auth status
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single()

  // Fetch bounce events from last 90 days
  const { data: bounceEvents } = await supabase
    .from("email_events")
    .select("*")
    .eq("organization_id", orgId)
    .in("event_type", ["bounced", "complained"])
    .gte(
      "timestamp",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("timestamp", { ascending: true })
    .limit(10000)

  // Aggregate totals for the period
  const { count: totalSent } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("event_type", "sent")
    .gte(
      "timestamp",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    )

  const { count: totalDelivered } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("event_type", "delivered")
    .gte(
      "timestamp",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    )

  // Build bounce trend data by week
  const bounceTrend: Record<
    string,
    { hard: number; soft: number; complaints: number }
  > = {}

  for (const event of bounceEvents ?? []) {
    const date = event.timestamp.split("T")[0]
    // Group by week
    const d = new Date(date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const weekKey = weekStart.toISOString().split("T")[0]

    if (!bounceTrend[weekKey]) {
      bounceTrend[weekKey] = { hard: 0, soft: 0, complaints: 0 }
    }

    if (event.event_type === "complained") {
      bounceTrend[weekKey].complaints++
    } else {
      const meta = event.metadata as Record<string, unknown> | null
      const bounceType = meta?.bounce_type as string | undefined
      if (bounceType === "hard") {
        bounceTrend[weekKey].hard++
      } else {
        bounceTrend[weekKey].soft++
      }
    }
  }

  const bounceTrendData = Object.entries(bounceTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, counts]) => ({ week, ...counts }))

  // Top bouncing domains from suppression list
  const { data: suppressions } = await supabase
    .from("suppression_list")
    .select("*")
    .eq("organization_id", orgId)
    .in("reason", ["hard_bounce", "complaint"])
    .limit(5000)

  const domainCounts: Record<string, number> = {}
  for (const s of suppressions ?? []) {
    const domain = s.email_address.split("@")[1]
    if (domain) {
      domainCounts[domain] = (domainCounts[domain] ?? 0) + 1
    }
  }

  const topBouncingDomains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Calculate deliverability score
  const sent = totalSent ?? 0
  const delivered = totalDelivered ?? 0
  const totalBounces = (bounceEvents ?? []).filter(
    (e) => e.event_type === "bounced"
  ).length
  const totalComplaints = (bounceEvents ?? []).filter(
    (e) => e.event_type === "complained"
  ).length

  let deliverabilityScore = 100
  if (sent > 0) {
    const deliveryRate = (delivered / sent) * 100
    const bounceRate = (totalBounces / sent) * 100
    const complaintRate = (totalComplaints / sent) * 100

    deliverabilityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          deliveryRate - bounceRate * 2 - complaintRate * 10
        )
      )
    )
  }

  return (
    <DeliverabilityClient
      score={deliverabilityScore}
      domainAuth={{
        domain: org?.sending_domain ?? null,
        domainVerified: org?.domain_verified ?? false,
        spf: org?.spf_verified ?? false,
        dkim: org?.dkim_verified ?? false,
        dmarc: org?.dmarc_verified ?? false,
      }}
      stats={{
        sent,
        delivered,
        bounced: totalBounces,
        complaints: totalComplaints,
      }}
      bounceTrend={bounceTrendData}
      topBouncingDomains={topBouncingDomains}
    />
  )
}
