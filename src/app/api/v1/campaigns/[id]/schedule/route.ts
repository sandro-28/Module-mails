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

// POST /api/v1/campaigns/:id/schedule — schedule campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params

  let body: { scheduled_at?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  if (!body.scheduled_at) {
    return apiError('scheduled_at is required (ISO 8601 date string).')
  }

  const scheduledDate = new Date(body.scheduled_at)
  if (isNaN(scheduledDate.getTime())) {
    return apiError('scheduled_at must be a valid ISO 8601 date string.')
  }
  if (scheduledDate <= new Date()) {
    return apiError('scheduled_at must be in the future.')
  }

  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (!campaign) {
    return apiError('Campaign not found.', 404)
  }
  if (campaign.status !== 'draft') {
    return apiError(`Only draft campaigns can be scheduled. Current status: "${campaign.status}".`, 409)
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      status: 'scheduled',
      scheduled_at: scheduledDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return apiError('Failed to schedule campaign.', 500)
  }

  return apiResponse(data)
}

// DELETE /api/v1/campaigns/:id/schedule — cancel schedule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (!campaign) {
    return apiError('Campaign not found.', 404)
  }
  if (campaign.status !== 'scheduled') {
    return apiError('Campaign is not currently scheduled.', 409)
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      status: 'draft',
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return apiError('Failed to cancel schedule.', 500)
  }

  return apiResponse(data)
}
