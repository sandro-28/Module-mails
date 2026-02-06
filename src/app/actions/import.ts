'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireTenantContext } from '@/lib/auth/tenant-context'
import { isValidEmail, normalizeEmail, hashEmail } from '@/lib/utils/email-validator'
import type { FieldMapping } from '@/lib/import/field-mapper'

interface ImportInput {
  rows: Record<string, string>[]
  mappings: FieldMapping[]
  targetListId?: string
  tags: string[]
  updateBehavior: 'update' | 'skip'
  consentSource: string
}

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: number
  errorRows: { row: number; email: string; reason: string }[]
}

const BATCH_SIZE = 100

export async function processImport(input: ImportInput): Promise<ImportResult> {
  const ctx = await requireTenantContext()
  const supabase = createAdminClient()

  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorRows: [],
  }

  // Build field mapping lookup: csvHeader -> targetField
  const fieldMap = new Map<string, string>()
  for (const mapping of input.mappings) {
    if (mapping.targetField) {
      fieldMap.set(mapping.csvHeader, mapping.targetField)
    }
  }

  // Find the email column
  const emailHeader = input.mappings.find((m) => m.targetField === 'email')?.csvHeader
  if (!emailHeader) {
    return {
      ...result,
      errors: 1,
      errorRows: [{ row: 0, email: '', reason: 'No email column mapped.' }],
    }
  }

  // Load suppression list for this org
  const { data: suppressionEntries } = await supabase
    .from('suppression_list')
    .select('email_address')
    .eq('organization_id', ctx.organizationId)

  const suppressedEmails = new Set(
    (suppressionEntries ?? []).map((s) => s.email_address.toLowerCase()),
  )

  // Process in batches
  for (let batchStart = 0; batchStart < input.rows.length; batchStart += BATCH_SIZE) {
    const batch = input.rows.slice(batchStart, batchStart + BATCH_SIZE)

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i]
      const rowIndex = batchStart + i + 1 // 1-based for display
      const rawEmail = row[emailHeader]?.trim()

      // Validate email
      if (!rawEmail || !isValidEmail(rawEmail)) {
        result.errors++
        result.errorRows.push({
          row: rowIndex,
          email: rawEmail ?? '',
          reason: 'Invalid email address',
        })
        continue
      }

      const email = normalizeEmail(rawEmail)

      // Check suppression list
      if (suppressedEmails.has(email)) {
        result.skipped++
        result.errorRows.push({
          row: rowIndex,
          email,
          reason: 'Email is on the suppression list',
        })
        continue
      }

      // Build contact data from mapped fields
      const contactData: Record<string, unknown> = {}
      for (const [csvHeader, targetField] of fieldMap.entries()) {
        if (targetField === 'email') continue
        const value = row[csvHeader]?.trim()
        if (value) {
          if (targetField === 'tags') {
            contactData[targetField] = value.split(',').map((t) => t.trim()).filter(Boolean)
          } else {
            contactData[targetField] = value
          }
        }
      }

      // Merge import-level tags
      if (input.tags.length > 0) {
        const existingTags = Array.isArray(contactData.tags) ? contactData.tags as string[] : []
        contactData.tags = [...new Set([...existingTags, ...input.tags])]
      }

      try {
        // Check if contact exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id, tags')
          .eq('organization_id', ctx.organizationId)
          .eq('email', email)
          .maybeSingle()

        if (existing) {
          if (input.updateBehavior === 'skip') {
            result.skipped++
            continue
          }

          // Update existing contact
          const updates: Record<string, unknown> = {
            ...contactData,
            updated_at: new Date().toISOString(),
          }

          // Merge tags
          if (Array.isArray(contactData.tags)) {
            const currentTags = (existing.tags ?? []) as string[]
            updates.tags = [...new Set([...currentTags, ...(contactData.tags as string[])])]
          }

          await supabase
            .from('contacts')
            .update(updates)
            .eq('id', existing.id)

          // Add to list if specified
          if (input.targetListId) {
            await supabase.from('list_contacts').upsert(
              {
                list_id: input.targetListId,
                contact_id: existing.id,
                status: 'active',
                source: input.consentSource,
              },
              { onConflict: 'list_id,contact_id', ignoreDuplicates: true },
            )
          }

          result.updated++
        } else {
          // Create new contact
          const { data: newContact, error: createError } = await supabase
            .from('contacts')
            .insert({
              organization_id: ctx.organizationId,
              email,
              email_hash: hashEmail(email),
              status: 'active',
              source: 'import',
              source_detail: input.consentSource,
              subscribed_at: new Date().toISOString(),
              ...contactData,
            })
            .select('id')
            .single()

          if (createError || !newContact) {
            result.errors++
            result.errorRows.push({
              row: rowIndex,
              email,
              reason: createError?.message ?? 'Failed to create contact',
            })
            continue
          }

          // Add to list if specified
          if (input.targetListId) {
            await supabase.from('list_contacts').insert({
              list_id: input.targetListId,
              contact_id: newContact.id,
              status: 'active',
              source: input.consentSource,
            })
          }

          result.imported++
        }
      } catch (err) {
        result.errors++
        result.errorRows.push({
          row: rowIndex,
          email,
          reason: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }
  }

  // Update list contact count if a target list was specified
  if (input.targetListId) {
    const { count } = await supabase
      .from('list_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', input.targetListId)

    await supabase
      .from('lists')
      .update({
        contact_count: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.targetListId)
  }

  // Create audit log
  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    user_id: ctx.user.id,
    action: 'contacts.imported',
    resource_type: 'contact',
    description: `Imported ${result.imported} contacts, updated ${result.updated}, skipped ${result.skipped}, errors ${result.errors}`,
    metadata: {
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    },
  })

  return result
}
