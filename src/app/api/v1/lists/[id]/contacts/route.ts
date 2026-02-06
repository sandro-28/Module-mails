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

// POST /api/v1/lists/:id/contacts — add contacts to list
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id: listId } = await params

  let body: { contact_ids?: string[] }
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  if (!Array.isArray(body.contact_ids) || body.contact_ids.length === 0) {
    return apiError('contact_ids array is required and must not be empty.')
  }

  const supabase = createAdminClient()

  // Verify list belongs to org
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('organization_id', auth.organizationId)
    .single()

  if (!list) {
    return apiError('List not found.', 404)
  }

  // Verify contacts belong to org
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', auth.organizationId)
    .in('id', body.contact_ids)

  const validIds = new Set((contacts ?? []).map((c) => c.id))

  // Build insert rows, skip duplicates
  const rows = body.contact_ids
    .filter((cid) => validIds.has(cid))
    .map((contact_id) => ({
      list_id: listId,
      contact_id,
      status: 'active' as const,
      source: 'api',
    }))

  if (rows.length === 0) {
    return apiError('No valid contact IDs found.')
  }

  const { data, error } = await supabase
    .from('list_contacts')
    .upsert(rows, { onConflict: 'list_id,contact_id', ignoreDuplicates: true })
    .select()

  if (error) {
    return apiError(error.message, 500)
  }

  // Update list contact count
  const { count } = await supabase
    .from('list_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId)

  await supabase
    .from('lists')
    .update({ contact_count: count ?? 0, updated_at: new Date().toISOString() })
    .eq('id', listId)

  return apiResponse({ added: data?.length ?? 0 }, 201)
}

// DELETE /api/v1/lists/:id/contacts — remove contact from list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id: listId } = await params

  let body: { contact_ids?: string[] }
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  if (!Array.isArray(body.contact_ids) || body.contact_ids.length === 0) {
    return apiError('contact_ids array is required and must not be empty.')
  }

  const supabase = createAdminClient()

  // Verify list belongs to org
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('organization_id', auth.organizationId)
    .single()

  if (!list) {
    return apiError('List not found.', 404)
  }

  const { error } = await supabase
    .from('list_contacts')
    .delete()
    .eq('list_id', listId)
    .in('contact_id', body.contact_ids)

  if (error) {
    return apiError(error.message, 500)
  }

  // Update list contact count
  const { count } = await supabase
    .from('list_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId)

  await supabase
    .from('lists')
    .update({ contact_count: count ?? 0, updated_at: new Date().toISOString() })
    .eq('id', listId)

  return apiResponse({ removed: body.contact_ids.length })
}
