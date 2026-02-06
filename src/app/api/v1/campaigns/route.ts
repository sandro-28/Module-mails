import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiResponse,
  apiError,
  paginatedResponse,
  authenticateApiKey,
  parseSearchParams,
  isErrorResponse,
} from '@/lib/api/helpers'
import type { CampaignStatus } from '@/types/database'

// GET /api/v1/campaigns — list campaigns with stats
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { page, perPage, status } = parseSearchParams(request)
  const supabase = createAdminClient()

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('campaigns')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as CampaignStatus)
  }

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  return paginatedResponse(data ?? [], count ?? 0, page, perPage)
}

// POST /api/v1/campaigns — create campaign (draft)
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const fromName = typeof body.from_name === 'string' ? body.from_name.trim() : ''
  const fromEmail = typeof body.from_email === 'string' ? body.from_email.trim() : ''

  if (!name) return apiError('Campaign name is required.')
  if (!subject) return apiError('Subject is required.')
  if (!fromName) return apiError('from_name is required.')
  if (!fromEmail) return apiError('from_email is required.')

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      organization_id: auth.organizationId,
      name,
      subject,
      from_name: fromName,
      from_email: fromEmail,
      status: 'draft',
      type: ((body.type as string) ?? 'regular') as import('@/types/database').CampaignType,
      preview_text: (body.preview_text as string) ?? null,
      reply_to: (body.reply_to as string) ?? null,
      template_id: (body.template_id as string) ?? null,
      html_content: (body.html_content as string) ?? null,
      text_content: (body.text_content as string) ?? null,
      list_ids: Array.isArray(body.list_ids) ? body.list_ids : [],
      segment_ids: Array.isArray(body.segment_ids) ? body.segment_ids : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      track_opens: typeof body.track_opens === 'boolean' ? body.track_opens : true,
      track_clicks: typeof body.track_clicks === 'boolean' ? body.track_clicks : true,
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiResponse(data, 201)
}
