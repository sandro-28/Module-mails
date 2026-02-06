import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let organization = null

  if (user) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()

    if (member) {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", member.organization_id)
        .single()
      organization = data
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          General Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization settings, defaults, and preferences.
        </p>
      </div>

      <SettingsClient organization={organization} />
    </div>
  )
}
