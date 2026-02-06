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

// GET /api/v1/templates/:id — template detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (error || !data) {
    return apiError('Template not found.', 404)
  }

  return apiResponse(data)
}

// PATCH /api/v1/templates/:id — update template
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

  const allowedFields = [
    'name', 'description', 'subject', 'preview_text', 'from_name', 'from_email',
    'reply_to', 'design_mode', 'category', 'html_content', 'text_content',
    'react_component', 'builder_data', 'tags', 'is_shared',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .select()
    .single()

  if (error || !data) {
    return apiError('Template not found or update failed.', 404)
  }

  return apiResponse(data)
}

// DELETE /api/v1/templates/:id — delete template (archive)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('email_templates')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .select()
    .single()

  if (error || !data) {
    return apiError('Template not found.', 404)
  }

  return apiResponse({ deleted: true })
}
