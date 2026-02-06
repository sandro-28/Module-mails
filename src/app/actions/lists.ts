"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ListType } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateListInput {
  organization_id: string
  name: string
  description?: string
  type: ListType
  double_opt_in: boolean
}

interface UpdateListInput {
  name?: string
  description?: string | null
  type?: ListType
  double_opt_in?: boolean
}

// ---------------------------------------------------------------------------
// createList
// ---------------------------------------------------------------------------

export async function createList(data: CreateListInput) {
  const supabase = await createClient()

  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      organization_id: data.organization_id,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      double_opt_in: data.double_opt_in,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/lists")
  return { data: list }
}

// ---------------------------------------------------------------------------
// updateList
// ---------------------------------------------------------------------------

export async function updateList(id: string, data: UpdateListInput) {
  const supabase = await createClient()

  const { data: list, error } = await supabase
    .from("lists")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/lists")
  revalidatePath(`/lists/${id}`)
  return { data: list }
}

// ---------------------------------------------------------------------------
// deleteList
// ---------------------------------------------------------------------------

export async function deleteList(id: string) {
  const supabase = await createClient()

  // Remove all list_contacts entries first
  await supabase.from("list_contacts").delete().eq("list_id", id)

  const { error } = await supabase.from("lists").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/lists")
  return { success: true }
}

// ---------------------------------------------------------------------------
// addContactsToList
// ---------------------------------------------------------------------------

export async function addContactsToList(
  listId: string,
  contactIds: string[]
) {
  const supabase = await createClient()

  const rows = contactIds.map((contactId) => ({
    list_id: listId,
    contact_id: contactId,
  }))

  const { error } = await supabase
    .from("list_contacts")
    .upsert(rows, { onConflict: "list_id,contact_id" })

  if (error) {
    return { error: error.message }
  }

  // Update the cached contact count on the list
  const { count } = await supabase
    .from("list_contacts")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId)

  if (count !== null) {
    await supabase
      .from("lists")
      .update({ contact_count: count })
      .eq("id", listId)
  }

  revalidatePath(`/lists/${listId}`)
  revalidatePath("/lists")
  return { success: true }
}

// ---------------------------------------------------------------------------
// removeContactFromList
// ---------------------------------------------------------------------------

export async function removeContactFromList(
  listId: string,
  contactId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("list_contacts")
    .delete()
    .eq("list_id", listId)
    .eq("contact_id", contactId)

  if (error) {
    return { error: error.message }
  }

  // Update the cached contact count on the list
  const { count } = await supabase
    .from("list_contacts")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId)

  if (count !== null) {
    await supabase
      .from("lists")
      .update({ contact_count: count })
      .eq("id", listId)
  }

  revalidatePath(`/lists/${listId}`)
  revalidatePath("/lists")
  return { success: true }
}

// ---------------------------------------------------------------------------
// duplicateList
// ---------------------------------------------------------------------------

export async function duplicateList(id: string) {
  const supabase = await createClient()

  const { data: original, error: fetchError } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !original) {
    return { error: fetchError?.message ?? "List not found" }
  }

  const { data: duplicate, error: insertError } = await supabase
    .from("lists")
    .insert({
      organization_id: original.organization_id,
      name: `${original.name} (copy)`,
      description: original.description,
      type: original.type,
      double_opt_in: original.double_opt_in,
      tags: original.tags,
    })
    .select()
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  // Copy list contacts for static lists
  if (original.type === "static" && duplicate) {
    const { data: contacts } = await supabase
      .from("list_contacts")
      .select("contact_id")
      .eq("list_id", id)

    if (contacts && contacts.length > 0) {
      const rows = contacts.map((c) => ({
        list_id: duplicate.id,
        contact_id: c.contact_id,
      }))
      await supabase.from("list_contacts").insert(rows)
      await supabase
        .from("lists")
        .update({ contact_count: contacts.length })
        .eq("id", duplicate.id)
    }
  }

  revalidatePath("/lists")
  return { data: duplicate }
}
