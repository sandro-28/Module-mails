import { createClient } from "@/lib/supabase/server"
import { SegmentsClient } from "./segments-client"

export const metadata = {
  title: "Segments | MailForge",
  description: "Create and manage contact segments",
}

export default async function SegmentsPage() {
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

  const organizationId = membership.organization_id

  // Fetch all segments for the organization
  const { data: segments } = await supabase
    .from("segments")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  return (
    <SegmentsClient
      segments={segments ?? []}
      organizationId={organizationId}
    />
  )
}
