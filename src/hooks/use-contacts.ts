"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Contact, ContactStatus } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FetchContactsParams {
  page?: number
  perPage?: number
  search?: string
  status?: ContactStatus | "all"
  sort?: string
  sortDirection?: "asc" | "desc"
  organizationId: string
}

export interface FetchContactsResult {
  data: Contact[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchContacts(
  params: FetchContactsParams
): Promise<FetchContactsResult> {
  const supabase = createClient()
  const {
    page = 1,
    perPage = 25,
    search,
    status,
    sort = "created_at",
    sortDirection = "desc",
    organizationId,
  } = params

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`
    )
  }

  query = query.order(sort, { ascending: sortDirection === "asc" })
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0
  return {
    data: (data as Contact[]) ?? [],
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      hasMore: page < Math.ceil(total / perPage),
    },
  }
}

async function fetchContact(id: string): Promise<Contact> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data as Contact
}

async function searchContacts(
  query: string,
  organizationId: string
): Promise<Contact[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .or(
      `email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
    )
    .limit(20)

  if (error) throw new Error(error.message)
  return (data as Contact[]) ?? []
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useContacts(params: FetchContactsParams) {
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: () => fetchContacts(params),
    placeholderData: (prev) => prev,
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContact(id),
    enabled: !!id,
  })
}

export function useSearchContacts(query: string, organizationId: string) {
  return useQuery({
    queryKey: ["contacts-search", query, organizationId],
    queryFn: () => searchContacts(query, organizationId),
    enabled: query.length >= 2,
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { deleteContact } = await import("@/app/actions/contacts")
      return deleteContact(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}
