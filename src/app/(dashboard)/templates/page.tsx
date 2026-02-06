import Link from "next/link"
import { Plus, Layout } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { TemplatesClient } from "./templates-client"
import type { EmailTemplate, OrganizationMember } from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Templates - MailForge",
  description: "Manage your email templates",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Please sign in to view templates.</p>
      </div>
    )
  }

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

  const { data: templates, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false }) as { data: EmailTemplate[] | null; error: { message: string } | null }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          Failed to load templates: {error.message}
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
            <Layout className="h-6 w-6 text-indigo-600" />
            Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Design and manage reusable email templates.
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Client interactive gallery */}
      <TemplatesClient templates={templates ?? []} />
    </div>
  )
}
