import { createHmac, randomBytes } from 'crypto'

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `mf_live_${randomBytes(32).toString('hex')}`
  const prefix = key.slice(0, 16)
  const hash = hashApiKey(key)
  return { key, prefix, hash }
}

export function hashApiKey(key: string): string {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is required')
  return createHmac('sha256', secret)
    .update(key)
    .digest('hex')
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function generateUnsubscribeToken(contactId: string, campaignId: string): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_TOKEN_SECRET environment variable is required')
  const data = `${contactId}:${campaignId}:${Date.now()}`
  return createHmac('sha256', secret)
    .update(data)
    .digest('hex')
}
