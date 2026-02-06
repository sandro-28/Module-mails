import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, type ApiAuthContext } from '@/lib/auth/api-auth'
import { rateLimit } from '@/lib/utils/rate-limiter'

// ---------------------------------------------------------------------------
// Standard API response helpers
// ---------------------------------------------------------------------------

export function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: { message } }, { status })
}

export function paginatedResponse(
  data: unknown[],
  total: number,
  page: number,
  perPage: number,
) {
  return NextResponse.json({
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
      has_more: page * perPage < total,
    },
    error: null,
  })
}

// ---------------------------------------------------------------------------
// Auth + rate-limit wrapper
// ---------------------------------------------------------------------------

export async function authenticateApiKey(
  request: NextRequest,
): Promise<ApiAuthContext | NextResponse> {
  const auth = await authenticateApiRequest(request)

  if (!auth.success) {
    return apiError(auth.error, auth.status)
  }

  // Rate limiting – 60 requests per minute per org
  const rl = rateLimit(
    `api:${auth.context.organizationId}`,
    60,
    60_000,
  )
  if (!rl.success) {
    return apiError('Rate limit exceeded. Try again later.', 429)
  }

  return auth.context
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseSearchParams(request: NextRequest) {
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') ?? '25', 10)))
  const search = url.searchParams.get('search') ?? undefined
  const status = url.searchParams.get('status') ?? undefined
  const cursor = url.searchParams.get('cursor') ?? undefined
  return { page, perPage, search, status, cursor }
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}
