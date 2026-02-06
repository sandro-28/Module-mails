import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import {
  getPaginationRange,
  createPaginatedResponse,
} from "@/lib/utils/pagination"
import { ContactsClient } from "./contacts-client"
import type { Contact, ContactStatus } from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Contacts | MailForge",
  description: "Manage your email contacts",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactsPageProps {
  searchParams: Promise<{
    page?: string
    perPage?: string
    search?: string
    status?: string
    sort?: string
    sortDirection?: string
  }>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(params.perPage) || 25))
  const search = params.search || ""
  const status = (params.status || "all") as ContactStatus | "all"
  const sort = params.sort || "created_at"
  const sortDirection = params.sortDirection === "asc" ? "asc" : "desc"

  const supabase = await createClient()

  // Fetch the user's organization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">Please sign in to view contacts.</p>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">No organization found.</p>
      </div>
    )
  }

  const organizationId = membership.organization_id
  const { from, to } = getPaginationRange(page, perPage)

  // Build query
  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)

  if (status !== "all") {
    query = query.eq("status", status)
  }

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`
    )
  }

  query = query.order(sort, { ascending: sortDirection === "asc" })
  query = query.range(from, to)

  const { data: contacts, count, error } = await query

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600">Error loading contacts</p>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    )
  }

  const total = count ?? 0
  const paginated = createPaginatedResponse(
    (contacts as Contact[]) ?? [],
    total,
    page,
    perPage
  )

  // Fetch available lists for bulk actions
  const { data: lists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name")

  return (
    <div className="space-y-6">
      <ContactsClient
        contacts={paginated.data}
        meta={paginated.meta}
        lists={(lists as { id: string; name: string }[]) ?? []}
        currentSearch={search}
        currentStatus={status}
        currentSort={sort}
        currentSortDirection={sortDirection as "asc" | "desc"}
      />
    </div>
  )
}
