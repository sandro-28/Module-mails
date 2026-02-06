import { createClient } from "@/lib/supabase/server"
import { CampaignAnalyticsClient } from "./campaign-analytics-client"

export const metadata = {
  title: "Campaign Analytics | MailForge",
  description: "Compare campaign performance metrics",
}

export default async function CampaignAnalyticsPage() {
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

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false })
    .limit(100)

  return <CampaignAnalyticsClient campaigns={campaigns ?? []} />
}
