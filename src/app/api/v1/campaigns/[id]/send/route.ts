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

// POST /api/v1/campaigns/:id/send — trigger campaign send
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { data: campaign, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (fetchError || !campaign) {
    return apiError('Campaign not found.', 404)
  }

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    return apiError(`Campaign cannot be sent — current status is "${campaign.status}".`, 409)
  }

  if (!campaign.html_content && !campaign.template_id) {
    return apiError('Campaign has no content. Set html_content or template_id first.', 422)
  }

  if (campaign.list_ids.length === 0 && campaign.segment_ids.length === 0) {
    return apiError('Campaign has no recipients. Add list_ids or segment_ids first.', 422)
  }

  // Transition to "sending" status
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      status: 'sending',
      sending_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return apiError('Failed to start sending.', 500)
  }

  // In a production system, this would enqueue a background job.
  // For now, we return immediately and the worker process picks it up.

  return apiResponse({
    campaign_id: id,
    status: 'sending',
    message: 'Campaign send has been initiated.',
  })
}
