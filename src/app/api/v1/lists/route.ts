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

// GET /api/v1/lists — list all lists
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { page, perPage } = parseSearchParams(request)
  const supabase = createAdminClient()

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count, error } = await supabase
    .from('lists')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return apiError(error.message, 500)
  }

  return paginatedResponse(data ?? [], count ?? 0, page, perPage)
}

// POST /api/v1/lists — create a new list
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
  if (!name) {
    return apiError('List name is required.')
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('lists')
    .insert({
      organization_id: auth.organizationId,
      name,
      description: (body.description as string) ?? null,
      type: (body.type as 'static' | 'dynamic') ?? 'static',
      double_opt_in: typeof body.double_opt_in === 'boolean' ? body.double_opt_in : false,
      tags: Array.isArray(body.tags) ? body.tags : [],
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiResponse(data, 201)
}
