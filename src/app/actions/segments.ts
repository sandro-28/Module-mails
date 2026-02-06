"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { buildSegmentQuery } from "@/lib/segmentation/query-builder"
import type { SegmentConditionGroup } from "@/types/database"
import { getPaginationRange } from "@/lib/utils/pagination"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateSegmentInput {
  organization_id: string
  name: string
  description?: string
  conditions: SegmentConditionGroup
}

interface UpdateSegmentInput {
  name?: string
  description?: string | null
  conditions?: SegmentConditionGroup
}

// ---------------------------------------------------------------------------
// createSegment
// ---------------------------------------------------------------------------

export async function createSegment(data: CreateSegmentInput) {
  const supabase = await createClient()

  // Calculate the initial count
  let baseQuery = supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", data.organization_id)

  baseQuery = buildSegmentQuery(data.conditions, baseQuery)
  const { count } = await baseQuery

  const { data: segment, error } = await supabase
    .from("segments")
    .insert({
      organization_id: data.organization_id,
      name: data.name,
      description: data.description ?? null,
      conditions: data.conditions,
      contact_count: count ?? 0,
      last_calculated_at: new Date().toISOString(),
      is_dynamic: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/segments")
  return { data: segment }
}

// ---------------------------------------------------------------------------
// updateSegment
// ---------------------------------------------------------------------------

export async function updateSegment(id: string, data: UpdateSegmentInput) {
  const supabase = await createClient()

  // If conditions changed, recalculate count
  let contactCount: number | undefined
  if (data.conditions) {
    const { data: existing } = await supabase
      .from("segments")
      .select("organization_id")
      .eq("id", id)
      .single()

    if (existing) {
      let countQuery = supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", existing.organization_id)

      countQuery = buildSegmentQuery(data.conditions, countQuery)
      const { count } = await countQuery
      contactCount = count ?? 0
    }
  }

  const updatePayload: Record<string, unknown> = { ...data }
  if (contactCount !== undefined) {
    updatePayload.contact_count = contactCount
    updatePayload.last_calculated_at = new Date().toISOString()
  }

  const { data: segment, error } = await supabase
    .from("segments")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/segments")
  revalidatePath(`/segments/${id}`)
  return { data: segment }
}

// ---------------------------------------------------------------------------
// deleteSegment
// ---------------------------------------------------------------------------

export async function deleteSegment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("segments").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/segments")
  return { success: true }
}

// ---------------------------------------------------------------------------
// calculateSegmentCount
// ---------------------------------------------------------------------------

export async function calculateSegmentCount(
  organizationId: string,
  conditions: SegmentConditionGroup
) {
  const supabase = await createClient()

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)

  query = buildSegmentQuery(conditions, query)
  const { count, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { count: count ?? 0 }
}

// ---------------------------------------------------------------------------
// recalculateSegment
// ---------------------------------------------------------------------------

export async function recalculateSegment(id: string) {
  const supabase = await createClient()

  const { data: segment, error: fetchError } = await supabase
    .from("segments")
    .select("organization_id, conditions")
    .eq("id", id)
    .single()

  if (fetchError || !segment) {
    return { error: fetchError?.message ?? "Segment not found" }
  }

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", segment.organization_id)

  query = buildSegmentQuery(segment.conditions, query)
  const { count } = await query

  const { error: updateError } = await supabase
    .from("segments")
    .update({
      contact_count: count ?? 0,
      last_calculated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/segments")
  revalidatePath(`/segments/${id}`)
  return { count: count ?? 0 }
}

// ---------------------------------------------------------------------------
// getSegmentContacts
// ---------------------------------------------------------------------------

export async function getSegmentContacts(
  id: string,
  page: number = 1,
  perPage: number = 20
) {
  const supabase = await createClient()

  const { data: segment, error: fetchError } = await supabase
    .from("segments")
    .select("organization_id, conditions")
    .eq("id", id)
    .single()

  if (fetchError || !segment) {
    return { error: fetchError?.message ?? "Segment not found" }
  }

  const { from, to } = getPaginationRange(page, perPage)

  let query = supabase
    .from("contacts")
    .select("id, email, first_name, last_name, status, engagement_score, created_at, tags", {
      count: "exact",
    })
    .eq("organization_id", segment.organization_id)

  query = buildSegmentQuery(segment.conditions, query)

  const { data: contacts, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return { error: error.message }
  }

  return {
    contacts: contacts ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  }
}

// ---------------------------------------------------------------------------
// duplicateSegment
// ---------------------------------------------------------------------------

export async function duplicateSegment(id: string) {
  const supabase = await createClient()

  const { data: original, error: fetchError } = await supabase
    .from("segments")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !original) {
    return { error: fetchError?.message ?? "Segment not found" }
  }

  const { data: duplicate, error: insertError } = await supabase
    .from("segments")
    .insert({
      organization_id: original.organization_id,
      name: `${original.name} (copy)`,
      description: original.description,
      conditions: original.conditions,
      contact_count: original.contact_count,
      last_calculated_at: original.last_calculated_at,
      is_dynamic: original.is_dynamic,
    })
    .select()
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath("/segments")
  return { data: duplicate }
}
