import { Resend } from 'resend'

let resendClient: Resend | null = null

/**
 * Get a singleton Resend client instance.
 * Throws if RESEND_API_KEY is not configured.
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}
