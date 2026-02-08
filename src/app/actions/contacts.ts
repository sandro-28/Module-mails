"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isValidEmail, normalizeEmail } from "@/lib/utils/email-validator"
import { z } from "zod"
import type {
  Contact as DBContact,
  ContactStatus,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Re-export the DB types for convenience
// ---------------------------------------------------------------------------

export type { ContactStatus } from "@/types/database"

/** Contact row from the database. */
export type Contact = DBContact

/** Mapped contact event used by timeline components. */
export interface ContactEvent {
  id: string
  contact_id: string | null
  type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ContactList {
  id: string
  name: string
  description: string | null
  contact_count: number
}

export interface ContactCampaign {
  id: string
  campaign_id: string
  campaign_name: string
  subject: string
  status: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createContactSchema = z.object({
  email: z.string().min(1, "Email is required"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  list_ids: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  consent_given: z.boolean().default(false),
})

const updateContactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  geo_city: z.string().optional(),
  geo_country: z.string().optional(),
  status: z
    .enum(["active", "unsubscribed", "bounced", "complained", "pending", "cleaned"])
    .optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) throw new Error("No organization found")
  return membership.organization_id
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  const raw = {
    email: formData.get("email") as string,
    first_name: (formData.get("first_name") as string) || undefined,
    last_name: (formData.get("last_name") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    company: (formData.get("company") as string) || undefined,
    list_ids: formData.getAll("list_ids") as string[],
    tags: formData.getAll("tags") as string[],
    consent_given: formData.get("consent_given") === "true",
  }

  const parsed = createContactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { email, first_name, last_name, phone, company, list_ids, tags, consent_given } =
    parsed.data

  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) {
    return { error: { email: ["Invalid email address"] } }
  }

  // Check suppression list
  const { data: suppressed } = await supabase
    .from("suppression_list")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email_address", normalizedEmail)
    .limit(1)
    .maybeSingle()

  if (suppressed) {
    return { error: { email: ["This email is on the suppression list and cannot be added"] } }
  }

  // Check for existing contact in same org
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { error: { email: ["A contact with this email already exists"] } }
  }

  // Insert the contact (matches contacts table Insert type)
  const { data: contact, error: insertError } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      email: normalizedEmail,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      company: company || null,
      status: "active" as const,
      engagement_score: 0,
      tags: tags || [],
      custom_fields: {},
      source: consent_given ? "manual" : null,
      ip_address: null,
      double_opt_in_confirmed: consent_given,
      subscribed_at: consent_given ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (insertError) {
    return { error: { _form: [insertError.message] } }
  }

  // Add to lists if specified (uses list_contacts table)
  if (list_ids && list_ids.length > 0 && contact) {
    const listEntries = list_ids.map((listId) => ({
      contact_id: contact.id,
      list_id: listId,
    }))
    await supabase.from("list_contacts").insert(listEntries)
  }

  revalidatePath("/contacts")
  return { data: contact }
}

export async function updateContact(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  const parsed = updateContactSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Verify email if being updated
  if (parsed.data.email) {
    const normalizedEmail = normalizeEmail(parsed.data.email)
    if (!isValidEmail(normalizedEmail)) {
      return { error: { email: ["Invalid email address"] } }
    }
    parsed.data.email = normalizedEmail
  }

  const { data: updated, error: updateError } = await supabase
    .from("contacts")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single()

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

  revalidatePath(`/contacts/${id}`)
  revalidatePath("/contacts")
  return { data: updated }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  // Remove from all lists (list_contacts table)
  await supabase
    .from("list_contacts")
    .delete()
    .eq("contact_id", id)

  // Remove all events
  await supabase
    .from("email_events")
    .delete()
    .eq("contact_id", id)

  // Remove campaign email associations
  await supabase
    .from("campaign_emails")
    .delete()
    .eq("contact_id", id)

  // Delete the contact itself (tenant-isolated)
  const { error: deleteError } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath("/contacts")
  return { success: true }
}

export async function bulkAddToList(contactIds: string[], listId: string) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  // Verify all contacts belong to the organization
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .in("id", contactIds)

  if (!contacts || contacts.length !== contactIds.length) {
    return { error: "Some contacts were not found or access denied" }
  }

  const entries = contactIds.map((contactId) => ({
    contact_id: contactId,
    list_id: listId,
  }))

  const { error } = await supabase
    .from("list_contacts")
    .upsert(entries, { onConflict: "contact_id,list_id" })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/contacts")
  return { success: true, count: contactIds.length }
}

export async function bulkAddTag(contactIds: string[], tag: string) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  // Update each contact to add the tag (using array append)
  const results = await Promise.allSettled(
    contactIds.map(async (contactId) => {
      const { data: contact } = await supabase
        .from("contacts")
        .select("tags")
        .eq("id", contactId)
        .eq("organization_id", organizationId)
        .single()

      if (!contact) return

      const existingTags: string[] = (contact.tags as string[]) || []
      if (existingTags.includes(tag)) return

      return supabase
        .from("contacts")
        .update({ tags: [...existingTags, tag] })
        .eq("id", contactId)
        .eq("organization_id", organizationId)
    })
  )

  const failCount = results.filter((r) => r.status === "rejected").length
  if (failCount > 0) {
    return { error: `Failed to update ${failCount} contacts` }
  }

  revalidatePath("/contacts")
  return { success: true, count: contactIds.length }
}

export async function bulkDelete(contactIds: string[]) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  // Delete related data first
  await supabase
    .from("list_contacts")
    .delete()
    .in("contact_id", contactIds)

  await supabase
    .from("email_events")
    .delete()
    .in("contact_id", contactIds)

  await supabase
    .from("campaign_emails")
    .delete()
    .in("contact_id", contactIds)

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", contactIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/contacts")
  return { success: true, count: contactIds.length }
}

export async function exportContacts(filters?: {
  status?: ContactStatus
  search?: string
  tag?: string
  listId?: string
}) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    )
  }
  if (filters?.tag) {
    query = query.contains("tags", [filters.tag])
  }

  const { data: contacts, error } = await query

  if (error) {
    return { error: error.message }
  }

  // Build CSV rows
  const headers = [
    "email",
    "first_name",
    "last_name",
    "phone",
    "company",
    "job_title",
    "geo_city",
    "geo_country",
    "status",
    "engagement_score",
    "tags",
    "double_opt_in_confirmed",
    "subscribed_at",
    "created_at",
  ]

  const rows = (contacts || []).map((c) =>
    headers
      .map((h) => {
        const value = c[h as keyof typeof c]
        if (Array.isArray(value)) return `"${value.join(", ")}"`
        if (value === null || value === undefined) return ""
        return `"${String(value).replace(/"/g, '""')}"`
      })
      .join(",")
  )

  const csv = [headers.join(","), ...rows].join("\n")
  return { data: csv, count: contacts?.length ?? 0 }
}
