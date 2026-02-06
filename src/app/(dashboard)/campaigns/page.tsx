import Link from "next/link"
import { Plus, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CampaignsClient } from "./campaigns-client"
import type { Campaign, OrganizationMember } from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Campaigns - MailForge",
  description: "Manage your email campaigns",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CampaignsPage() {
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Please sign in to view campaigns.</p>
      </div>
    )
  }

  // Get organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single() as { data: Pick<OrganizationMember, "organization_id"> | null }

  if (!membership) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">No organization found.</p>
      </div>
    )
  }

  // Fetch campaigns with stats
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false }) as { data: Campaign[] | null; error: { message: string } | null }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          Failed to load campaigns: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Mail className="h-6 w-6 text-indigo-600" />
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, manage, and track your email campaigns.
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Client-side interactive list */}
      <CampaignsClient campaigns={campaigns ?? []} />
    </div>
  )
}
