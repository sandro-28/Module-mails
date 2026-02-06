import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidEmail, normalizeEmail } from '@/lib/utils/email-validator'
import {
  apiResponse,
  apiError,
  authenticateApiKey,
  isErrorResponse,
} from '@/lib/api/helpers'

// POST /api/v1/send — send a single transactional email immediately
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  let body: {
    to?: string
    subject?: string
    html?: string
    text?: string
    from_name?: string
    from_email?: string
    tags?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body')
  }

  if (!body.to || !isValidEmail(body.to)) {
    return apiError('A valid "to" email address is required.')
  }
  if (!body.subject?.trim()) {
    return apiError('"subject" is required.')
  }
  if (!body.html && !body.text) {
    return apiError('Either "html" or "text" content is required.')
  }

  const supabase = createAdminClient()

  // Fetch org for defaults
  const { data: org } = await supabase
    .from('organizations')
    .select('default_from_name, default_from_email, monthly_email_limit, monthly_emails_sent')
    .eq('id', auth.organizationId)
    .single()

  if (!org) {
    return apiError('Organization not found.', 500)
  }

  // Check sending limits
  if (org.monthly_emails_sent >= org.monthly_email_limit) {
    return apiError('Monthly email sending limit reached.', 429)
  }

  const fromName = body.from_name ?? org.default_from_name ?? 'MailForge'
  const fromEmail = body.from_email ?? org.default_from_email ?? 'noreply@mailforge.dev'

  // Check suppression list
  const toEmail = normalizeEmail(body.to)
  const { data: suppressed } = await supabase
    .from('suppression_list')
    .select('id')
    .eq('organization_id', auth.organizationId)
    .eq('email_address', toEmail)
    .maybeSingle()

  if (suppressed) {
    return apiError('This email address is on the suppression list.', 422)
  }

  // In a real implementation we would call Resend here.
  // For now, record the transactional email event.
  const { error: eventError } = await supabase.from('email_events').insert({
    organization_id: auth.organizationId,
    email_address: toEmail,
    event_type: 'sent',
    timestamp: new Date().toISOString(),
    metadata: {
      subject: body.subject,
      from_name: fromName,
      from_email: fromEmail,
      tags: body.tags ?? [],
      type: 'transactional',
    },
  })

  if (eventError) {
    return apiError('Failed to record email event.', 500)
  }

  // Increment monthly counter
  await supabase
    .from('organizations')
    .update({ monthly_emails_sent: org.monthly_emails_sent + 1 })
    .eq('id', auth.organizationId)

  return apiResponse({
    message: 'Email queued for delivery.',
    to: toEmail,
    subject: body.subject,
    from: `${fromName} <${fromEmail}>`,
  })
}
