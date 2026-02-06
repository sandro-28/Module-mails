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
import type { DesignMode, TemplateCategory } from '@/types/database'

// GET /api/v1/templates — list templates
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { page, perPage } = parseSearchParams(request)
  const supabase = createAdminClient()

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count, error } = await supabase
    .from('email_templates')
    .select('id, name, description, subject, category, design_mode, is_shared, is_archived, tags, usage_count, created_at, updated_at', { count: 'exact' })
    .eq('organization_id', auth.organizationId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return apiError(error.message, 500)
  }

  return paginatedResponse(data ?? [], count ?? 0, page, perPage)
}

// POST /api/v1/templates — create template
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
    return apiError('Template name is required.')
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      organization_id: auth.organizationId,
      name,
      description: (body.description as string) ?? null,
      subject: (body.subject as string) ?? null,
      preview_text: (body.preview_text as string) ?? null,
      from_name: (body.from_name as string) ?? null,
      from_email: (body.from_email as string) ?? null,
      reply_to: (body.reply_to as string) ?? null,
      design_mode: ((body.design_mode as string) ?? 'code') as DesignMode,
      category: ((body.category as string) ?? 'custom') as TemplateCategory,
      html_content: (body.html_content as string) ?? null,
      text_content: (body.text_content as string) ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiResponse(data, 201)
}
