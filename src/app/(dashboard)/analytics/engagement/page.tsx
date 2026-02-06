import { createClient } from "@/lib/supabase/server"
import { EngagementAnalyticsClient } from "./engagement-analytics-client"

export const metadata = {
  title: "Engagement Analytics | MailForge",
  description: "Contact engagement score analysis",
}

export default async function EngagementAnalyticsPage() {
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

  // Fetch all contacts with engagement scores
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .limit(50000)

  // Build engagement distribution
  const scores = (contacts ?? []).map((c) => c.engagement_score)

  // Segment counts
  const veryEngaged = scores.filter((s) => s > 80).length
  const engaged = scores.filter((s) => s > 50 && s <= 80).length
  const lukewarm = scores.filter((s) => s >= 20 && s <= 50).length
  const inactive = scores.filter((s) => s < 20).length

  // Build histogram data (buckets of 10)
  const histogram: { range: string; count: number }[] = []
  for (let i = 0; i < 100; i += 10) {
    const count = scores.filter((s) => s >= i && s < i + 10).length
    histogram.push({
      range: `${i}-${i + 9}`,
      count,
    })
  }

  return (
    <EngagementAnalyticsClient
      segments={{
        veryEngaged,
        engaged,
        lukewarm,
        inactive,
      }}
      histogram={histogram}
      totalContacts={scores.length}
      averageScore={
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0
      }
    />
  )
}
