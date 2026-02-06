import { createClient } from "@/lib/supabase/server"
import { ListsClient } from "./lists-client"

export const metadata = {
  title: "Lists | MailForge",
  description: "Manage your contact lists",
}

export default async function ListsPage() {
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

  // Fetch all lists for the organization
  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  return (
    <ListsClient
      lists={lists ?? []}
      organizationId={organizationId}
    />
  )
}
