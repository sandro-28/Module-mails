import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/utils/crypto'
import {
  apiResponse,
  apiError,
  paginatedResponse,
  authenticateApiKey,
  parseSearchParams,
  isErrorResponse,
} from '@/lib/api/helpers'

// GET /api/v1/webhooks — list webhooks
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { page, perPage } = parseSearchParams(request)
  const supabase = createAdminClient()

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count, error } = await supabase
    .from('webhooks')
    .select('id, name, description, url, events, is_active, last_triggered_at, total_triggers, total_successes, total_failures, created_at', { count: 'exact' })
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return apiError(error.message, 500)
  }

  return paginatedResponse(data ?? [], count ?? 0, page, perPage)
}

// POST /api/v1/webhooks — create webhook
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
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  const events = Array.isArray(body.events) ? body.events : []

  if (!name) return apiError('Webhook name is required.')
  if (!url) return apiError('Webhook URL is required.')
  if (events.length === 0) return apiError('At least one event type is required.')

  try {
    new URL(url)
  } catch {
    return apiError('Invalid webhook URL.')
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      organization_id: auth.organizationId,
      name,
      url,
      events,
      secret: generateToken(),
      description: (body.description as string) ?? null,
      headers: typeof body.headers === 'object' && body.headers !== null
        ? (body.headers as Record<string, string>)
        : null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiResponse(data, 201)
}
