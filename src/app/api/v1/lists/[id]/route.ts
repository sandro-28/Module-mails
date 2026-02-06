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

// GET /api/v1/lists/:id — list detail with contact count
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (error || !data) {
    return apiError('List not found.', 404)
  }

  // Get live contact count
  const { count } = await supabase
    .from('list_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', id)
    .eq('status', 'active')

  return apiResponse({ ...data, active_contact_count: count ?? data.active_contact_count })
}

// PATCH /api/v1/lists/:id — update list
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

  const allowedFields = ['name', 'description', 'double_opt_in', 'tags', 'default_from_name', 'default_from_email']
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('lists')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .select()
    .single()

  if (error || !data) {
    return apiError('List not found or update failed.', 404)
  }

  return apiResponse(data)
}

// DELETE /api/v1/lists/:id — delete list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  // Remove memberships first
  await supabase.from('list_contacts').delete().eq('list_id', id)

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', id)
    .eq('organization_id', auth.organizationId)

  if (error) {
    return apiError('Failed to delete list.', 500)
  }

  return apiResponse({ deleted: true })
}
