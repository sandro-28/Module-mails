import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import type { Organization, Membership, OrganizationUser, MemberRole, PlanTier } from "@/hooks/use-organization"

// ---------------------------------------------------------------------------
// Server-side auth check + tenant resolution
// ---------------------------------------------------------------------------

async function getAuthAndOrg() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch organisation membership for the authenticated user
  const { data: membershipRow } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  let organization: Organization | null = null
  let membership: Membership | null = null

  if (membershipRow) {
    const org = membershipRow.organizations as unknown as Record<string, unknown>
    organization = {
      id: org.id as string,
      name: org.name as string,
      slug: org.slug as string,
      logo_url: (org.logo_url as string) ?? null,
      plan: (org.plan as PlanTier) ?? "free",
      contact_limit: (org.contact_limit as number) ?? 1000,
      email_limit: (org.email_limit as number) ?? 5000,
      created_at: org.created_at as string,
    }

    membership = {
      id: membershipRow.id,
      user_id: membershipRow.user_id,
      organization_id: membershipRow.organization_id,
      role: membershipRow.role as MemberRole,
      created_at: membershipRow.created_at,
    }
  }

  const orgUser: OrganizationUser = {
    id: user.id,
    email: user.email ?? "",
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }

  return { organization, membership, user: orgUser }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { organization, membership, user } = await getAuthAndOrg()

  return (
    <DashboardShell
      organization={organization}
      membership={membership}
      user={user}
    >
      {children}
    </DashboardShell>
  )
}
