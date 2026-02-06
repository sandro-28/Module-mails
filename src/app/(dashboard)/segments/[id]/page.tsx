import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SegmentDetailClient } from "./segment-detail-client"
import { buildSegmentQuery } from "@/lib/segmentation/query-builder"

interface SegmentDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: SegmentDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: segment } = await supabase
    .from("segments")
    .select("*")
    .eq("id", id)
    .single()

  return {
    title: segment
      ? `${segment.name} | Segments | MailForge`
      : "Segment | MailForge",
  }
}

export default async function SegmentDetailPage({
  params,
  searchParams,
}: SegmentDetailPageProps) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const supabase = await createClient()

  // Fetch segment
  const { data: segment, error } = await supabase
    .from("segments")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !segment) {
    notFound()
  }

  // Pagination
  const page = parseInt(pageParam ?? "1", 10)
  const perPage = 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Query matching contacts
  let contactsQuery = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("organization_id", segment.organization_id)

  contactsQuery = buildSegmentQuery(segment.conditions, contactsQuery)

  const { data: contacts, count } = await contactsQuery
    .order("created_at", { ascending: false })
    .range(from, to)

  return (
    <SegmentDetailClient
      segment={segment}
      contacts={contacts ?? []}
      totalContacts={count ?? 0}
      currentPage={page}
      perPage={perPage}
    />
  )
}
