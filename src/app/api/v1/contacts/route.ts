import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidEmail, normalizeEmail, hashEmail } from '@/lib/utils/email-validator'
import {
  apiResponse,
  apiError,
  paginatedResponse,
  authenticateApiKey,
  parseSearchParams,
  isErrorResponse,
} from '@/lib/api/helpers'
import type { ContactStatus } from '@/types/database'

// GET /api/v1/contacts — list contacts with pagination, search, status filter
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { page, perPage, search, status, cursor } = parseSearchParams(request)
  const supabase = createAdminClient()

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as ContactStatus)
  }

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
    )
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  return paginatedResponse(data ?? [], count ?? 0, page, perPage)
}

// POST /api/v1/contacts — create a new contact
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  if (!isValidEmail(email)) {
    return apiError('A valid email address is required.')
  }

  const supabase = createAdminClient()

  // Check for existing contact in this org
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', auth.organizationId)
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return apiError('A contact with this email already exists.', 409)
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      organization_id: auth.organizationId,
      email,
      email_hash: hashEmail(email),
      first_name: (body.first_name as string) ?? null,
      last_name: (body.last_name as string) ?? null,
      phone: (body.phone as string) ?? null,
      company: (body.company as string) ?? null,
      job_title: (body.job_title as string) ?? null,
      status: 'active',
      source: 'api',
      tags: Array.isArray(body.tags) ? body.tags : [],
      custom_fields: typeof body.custom_fields === 'object' && body.custom_fields !== null
        ? (body.custom_fields as Record<string, unknown>)
        : {},
      subscribed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiResponse(data, 201)
}
