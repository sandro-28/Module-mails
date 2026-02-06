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

// GET /api/v1/campaigns/:id — campaign detail with stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (error || !data) {
    return apiError('Campaign not found.', 404)
  }

  return apiResponse(data)
}

// PATCH /api/v1/campaigns/:id — update campaign (if draft)
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

  // Verify campaign exists and is draft
  const { data: existing } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (!existing) {
    return apiError('Campaign not found.', 404)
  }
  if (existing.status !== 'draft') {
    return apiError('Only draft campaigns can be updated.', 409)
  }

  const allowedFields = [
    'name', 'subject', 'preview_text', 'from_name', 'from_email', 'reply_to',
    'template_id', 'html_content', 'text_content', 'list_ids', 'segment_ids',
    'excluded_list_ids', 'excluded_segment_ids', 'tags', 'track_opens', 'track_clicks',
    'type', 'send_config',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .select()
    .single()

  if (error || !data) {
    return apiError('Update failed.', 500)
  }

  return apiResponse(data)
}

// DELETE /api/v1/campaigns/:id — delete campaign
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  // Clean up related data
  await supabase.from('campaign_emails').delete().eq('campaign_id', id)
  await supabase.from('email_events').delete().eq('campaign_id', id)
  await supabase.from('tracked_links').delete().eq('campaign_id', id)

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('organization_id', auth.organizationId)

  if (error) {
    return apiError('Failed to delete campaign.', 500)
  }

  return apiResponse({ deleted: true })
}
