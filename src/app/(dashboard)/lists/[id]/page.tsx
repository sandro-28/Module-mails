import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ListDetailClient } from "./list-detail-client"

interface ListDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; search?: string }>
}

export async function generateMetadata({ params }: ListDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single()

  return {
    title: list ? `${list.name} | Lists | MailForge` : "List | MailForge",
  }
}

export default async function ListDetailPage({
  params,
  searchParams,
}: ListDetailPageProps) {
  const { id } = await params
  const { page: pageParam, search: searchParam } = await searchParams
  const supabase = await createClient()

  // Fetch list
  const { data: list, error } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !list) {
    notFound()
  }

  // Pagination
  const page = parseInt(pageParam ?? "1", 10)
  const perPage = 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Build query for contacts in this list
  let contactsQuery = supabase
    .from("list_contacts")
    .select(
      "*, contacts!inner(*)",
      { count: "exact" }
    )
    .eq("list_id", id)

  if (searchParam) {
    contactsQuery = contactsQuery.ilike(
      "contacts.email",
      `%${searchParam}%`
    )
  }

  const { data: listContacts, count } = await contactsQuery
    .order("subscribed_at", { ascending: false })
    .range(from, to)

  // Fetch segment if dynamic list
  let segmentConditions = null
  if (list.type === "dynamic" && list.dynamic_segment_id) {
    const { data: segment } = await supabase
      .from("segments")
      .select("*")
      .eq("id", list.dynamic_segment_id)
      .single()
    segmentConditions = segment?.conditions ?? null
  }

  // Fetch all contacts for the organization (for the add contacts picker)
  const { data: allContacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", list.organization_id)
    .eq("status", "active")
    .order("email")
    .limit(500)

  return (
    <ListDetailClient
      list={list}
      listContacts={listContacts ?? []}
      totalContacts={count ?? 0}
      currentPage={page}
      perPage={perPage}
      searchQuery={searchParam ?? ""}
      segmentConditions={segmentConditions}
      allContacts={allContacts ?? []}
    />
  )
}
