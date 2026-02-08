import { getResendClient } from './client'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  from: string
  replyTo?: string
  headers?: Record<string, string>
  tags?: { name: string; value: string }[]
  /** List-Unsubscribe header URL */
  unsubscribeUrl?: string
  /** List-Unsubscribe-Post header value */
  unsubscribePost?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send a single email via Resend.
 * Automatically adds List-Unsubscribe headers for compliance,
 * and X-Mailer tracking header.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const resend = getResendClient()

  // Build headers with compliance additions
  const headers: Record<string, string> = {
    'X-Mailer': 'MailForge/1.0',
    ...params.headers,
  }

  // Add List-Unsubscribe headers (required by major ESPs for compliance)
  if (params.unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${params.unsubscribeUrl}>`
    headers['List-Unsubscribe-Post'] = params.unsubscribePost ?? 'List-Unsubscribe=One-Click'
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      headers,
      tags: params.tags,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email'
    return { success: false, error: message }
  }
}

/**
 * Send a batch of emails via Resend.
 */
export async function sendBatchEmails(
  emails: SendEmailParams[],
): Promise<SendEmailResult[]> {
  const resend = getResendClient()

  const batchPayload = emails.map((email) => {
    const headers: Record<string, string> = {
      'X-Mailer': 'MailForge/1.0',
      ...email.headers,
    }

    if (email.unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${email.unsubscribeUrl}>`
      headers['List-Unsubscribe-Post'] = email.unsubscribePost ?? 'List-Unsubscribe=One-Click'
    }

    return {
      from: email.from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo,
      headers,
      tags: email.tags,
    }
  })

  try {
    const { data, error } = await resend.batch.send(batchPayload)

    if (error) {
      return emails.map(() => ({ success: false, error: error.message }))
    }

    return (data?.data || []).map((result) => ({
      success: true,
      id: result.id,
    }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown batch send error'
    return emails.map(() => ({ success: false, error: message }))
  }
}
