'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireTenantContext } from '@/lib/auth/tenant-context'
import { generateSlug } from '@/lib/utils'
import { isValidEmail, normalizeEmail, hashEmail } from '@/lib/utils/email-validator'
import type { SignupFormConfig, SignupFormStyle } from '@/types/database'

export async function createForm(data: {
  name: string
  type: string
  config: SignupFormConfig
  style: SignupFormStyle
}): Promise<{ id?: string; error?: string }> {
  const ctx = await requireTenantContext()
  const supabase = createAdminClient()

  const slug = generateSlug(data.name) + '-' + Date.now().toString(36)

  const { data: form, error } = await supabase
    .from('signup_forms')
    .insert({
      organization_id: ctx.organizationId,
      name: data.name,
      type: data.type as 'embedded' | 'popup' | 'landing' | 'flyout' | 'bar',
      config: data.config,
      style: data.style,
      status: 'active',
      hosted_url: `/subscribe/${slug}`,
      created_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { id: form.id }
}

export async function updateForm(
  id: string,
  data: {
    name?: string
    config?: SignupFormConfig
    style?: SignupFormStyle
    status?: 'active' | 'inactive' | 'archived'
  },
): Promise<{ error?: string }> {
  const ctx = await requireTenantContext()
  const supabase = createAdminClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.name !== undefined) updates.name = data.name
  if (data.config !== undefined) updates.config = data.config
  if (data.style !== undefined) updates.style = data.style
  if (data.status !== undefined) updates.status = data.status

  const { error } = await supabase
    .from('signup_forms')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function deleteForm(id: string): Promise<{ error?: string }> {
  const ctx = await requireTenantContext()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('signup_forms')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function submitForm(
  formId: string,
  data: Record<string, string>,
): Promise<{ success?: boolean; double_opt_in?: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Load form
  const { data: form } = await supabase
    .from('signup_forms')
    .select('*')
    .eq('id', formId)
    .eq('status', 'active')
    .single()

  if (!form) {
    return { error: 'Form not found or inactive.' }
  }

  // Validate required fields
  for (const field of form.config.fields) {
    if (field.required && !data[field.key]?.trim()) {
      return { error: `${field.label} is required.` }
    }
  }

  // Validate email
  const email = data.email
  if (!email || !isValidEmail(email)) {
    return { error: 'A valid email address is required.' }
  }

  const normalizedEmail = normalizeEmail(email)

  // Check suppression list
  const { data: suppressed } = await supabase
    .from('suppression_list')
    .select('id')
    .eq('organization_id', form.organization_id)
    .eq('email_address', normalizedEmail)
    .maybeSingle()

  if (suppressed) {
    return { error: 'This email address cannot be subscribed.' }
  }

  // Upsert contact
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id, status')
    .eq('organization_id', form.organization_id)
    .eq('email', normalizedEmail)
    .maybeSingle()

  let contactId: string

  if (existingContact) {
    // Update existing contact
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.first_name) updates.first_name = data.first_name
    if (data.last_name) updates.last_name = data.last_name
    if (data.phone) updates.phone = data.phone
    if (data.company) updates.company = data.company

    // Re-subscribe if unsubscribed
    if (existingContact.status === 'unsubscribed') {
      updates.status = form.config.double_opt_in ? 'pending' : 'active'
      updates.subscribed_at = new Date().toISOString()
      updates.unsubscribed_at = null
    }

    // Add tags
    if (form.config.tags_to_apply.length > 0) {
      const { data: current } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', existingContact.id)
        .single()
      const existingTags = (current?.tags ?? []) as string[]
      const mergedTags = [...new Set([...existingTags, ...form.config.tags_to_apply])]
      updates.tags = mergedTags
    }

    await supabase.from('contacts').update(updates).eq('id', existingContact.id)
    contactId = existingContact.id
  } else {
    // Create new contact
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: form.organization_id,
        email: normalizedEmail,
        email_hash: hashEmail(normalizedEmail),
        first_name: data.first_name ?? null,
        last_name: data.last_name ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        status: form.config.double_opt_in ? 'pending' : 'active',
        source: 'form',
        source_detail: form.name,
        tags: form.config.tags_to_apply,
        subscribed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (contactError || !newContact) {
      return { error: 'Failed to create contact.' }
    }
    contactId = newContact.id
  }

  // Add to lists
  for (const listId of form.config.lists_to_add) {
    await supabase.from('list_contacts').upsert(
      {
        list_id: listId,
        contact_id: contactId,
        status: 'active',
        source: 'form',
      },
      { onConflict: 'list_id,contact_id', ignoreDuplicates: true },
    )
  }

  // Update form stats
  await supabase
    .from('signup_forms')
    .update({
      total_submissions: (form.total_submissions ?? 0) + 1,
      total_conversions: (form.total_conversions ?? 0) + 1,
      conversion_rate:
        form.total_views > 0
          ? (((form.total_conversions ?? 0) + 1) / form.total_views) * 100
          : 0,
      last_submission_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', formId)

  // If double opt-in, we would send a confirmation email here
  if (form.config.double_opt_in) {
    // TODO: send confirmation email
    return { success: true, double_opt_in: true }
  }

  return { success: true }
}
