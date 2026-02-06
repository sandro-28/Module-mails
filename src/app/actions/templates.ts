"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  EmailTemplate,
  EmailTemplateInsert,
  EmailTemplateUpdate,
  OrganizationMember,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single() as { data: Pick<OrganizationMember, "organization_id"> | null; error: unknown }

  if (memberError || !membership) throw new Error("No organization found")
  return membership.organization_id
}

// ---------------------------------------------------------------------------
// Create template
// ---------------------------------------------------------------------------

export async function createTemplate(
  data: Omit<EmailTemplateInsert, "organization_id">
): Promise<EmailTemplate> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const insertData: EmailTemplateInsert = {
    ...data,
    organization_id: organizationId,
    last_edited_by: user?.id ?? null,
  }

  const { data: template, error } = await (supabase
    .from("email_templates")
    .insert(insertData as SupabaseAny)
    .select()
    .single() as unknown as Promise<{ data: EmailTemplate | null; error: { message: string } | null }>)

  if (error || !template) throw new Error(`Failed to create template: ${error?.message ?? "Unknown error"}`)

  // Create initial version
  await (supabase.from("email_template_versions").insert({
    template_id: template.id,
    version: 1,
    name: template.name,
    subject: template.subject,
    preview_text: template.preview_text,
    html_content: template.html_content,
    text_content: template.text_content,
    design_mode: template.design_mode,
    change_description: "Initial version",
    created_by: user?.id ?? null,
  } as SupabaseAny) as unknown as Promise<unknown>)

  revalidatePath("/templates")
  return template
}

// ---------------------------------------------------------------------------
// Update template
// ---------------------------------------------------------------------------

export async function updateTemplate(id: string, data: EmailTemplateUpdate): Promise<EmailTemplate> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch current version for incrementing
  const { data: current } = await (supabase
    .from("email_templates")
    .select("version")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single() as unknown as Promise<{ data: Pick<EmailTemplate, "version"> | null }>)

  const newVersion = (current?.version ?? 0) + 1

  const updateData: EmailTemplateUpdate = {
    ...data,
    version: newVersion,
    last_edited_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data: template, error } = await ((supabase
    .from("email_templates") as SupabaseAny)
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single() as unknown as Promise<{ data: EmailTemplate | null; error: { message: string } | null }>)

  if (error || !template) throw new Error(`Failed to update template: ${error?.message ?? "Unknown error"}`)

  // Create version snapshot
  await (supabase.from("email_template_versions").insert({
    template_id: id,
    version: newVersion,
    name: template.name,
    subject: template.subject,
    preview_text: template.preview_text,
    html_content: template.html_content,
    text_content: template.text_content,
    design_mode: template.design_mode,
    change_description: data.description ?? `Version ${newVersion}`,
    created_by: user?.id ?? null,
  } as SupabaseAny) as unknown as Promise<unknown>)

  revalidatePath("/templates")
  revalidatePath(`/templates/${id}`)
  return template
}

// ---------------------------------------------------------------------------
// Delete template
// ---------------------------------------------------------------------------

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  const { error } = await (supabase
    .from("email_templates")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId) as unknown as Promise<{ error: { message: string } | null }>)

  if (error) throw new Error(`Failed to delete template: ${error.message}`)

  revalidatePath("/templates")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Duplicate template
// ---------------------------------------------------------------------------

export async function duplicateTemplate(id: string): Promise<EmailTemplate> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: original, error: fetchError } = await (supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single() as unknown as Promise<{ data: EmailTemplate | null; error: { message: string } | null }>)

  if (fetchError || !original) throw new Error("Template not found")

  const duplicateData: EmailTemplateInsert = {
    organization_id: organizationId,
    name: `${original.name} (Copy)`,
    description: original.description,
    subject: original.subject,
    preview_text: original.preview_text,
    from_name: original.from_name,
    from_email: original.from_email,
    reply_to: original.reply_to,
    design_mode: original.design_mode,
    category: original.category,
    html_content: original.html_content,
    text_content: original.text_content,
    react_component: original.react_component,
    builder_data: original.builder_data,
    tags: original.tags,
    version: 1,
    last_edited_by: user?.id ?? null,
  }

  const { data: duplicate, error: insertError } = await (supabase
    .from("email_templates")
    .insert(duplicateData as SupabaseAny)
    .select()
    .single() as unknown as Promise<{ data: EmailTemplate | null; error: { message: string } | null }>)

  if (insertError || !duplicate)
    throw new Error(`Failed to duplicate template: ${insertError?.message ?? "Unknown error"}`)

  revalidatePath("/templates")
  return duplicate
}
