import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiResponse,
  apiError,
  authenticateApiKey,
  isErrorResponse,
} from '@/lib/api/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/v1/contacts/:id — single contact detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (error || !data) {
    return apiError('Contact not found.', 404)
  }

  return apiResponse(data)
}

// PATCH /api/v1/contacts/:id — update contact
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  const supabase = createAdminClient()

  // Only allow safe fields to be updated
  const allowedFields = [
    'first_name', 'last_name', 'phone', 'company', 'job_title',
    'tags', 'custom_fields', 'status', 'language', 'timezone',
  ]
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .select()
    .single()

  if (error || !data) {
    return apiError('Contact not found or update failed.', 404)
  }

  return apiResponse(data)
}

// DELETE /api/v1/contacts/:id — GDPR delete
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  // Verify the contact belongs to this org
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, email')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (!contact) {
    return apiError('Contact not found.', 404)
  }

  // Remove list memberships
  await supabase.from('list_contacts').delete().eq('contact_id', id)

  // Remove email events referencing this contact
  await supabase.from('email_events').delete().eq('contact_id', id)

  // Remove campaign emails referencing this contact
  await supabase.from('campaign_emails').delete().eq('contact_id', id)

  // Delete the contact itself
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('organization_id', auth.organizationId)

  if (error) {
    return apiError('Failed to delete contact.', 500)
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    organization_id: auth.organizationId,
    api_key_id: auth.apiKeyId,
    action: 'contact.deleted',
    resource_type: 'contact',
    resource_id: id,
    description: `GDPR deletion of contact ${contact.email}`,
  })

  return apiResponse({ deleted: true })
}
