import { createHmac, randomBytes } from 'crypto'

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `mf_live_${randomBytes(32).toString('hex')}`
  const prefix = key.slice(0, 16)
  const hash = hashApiKey(key)
  return { key, prefix, hash }
}

export function hashApiKey(key: string): string {
  return createHmac('sha256', process.env.API_KEY_ENCRYPTION_SECRET || 'default-secret')
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
  const data = `${contactId}:${campaignId}:${Date.now()}`
  return createHmac('sha256', process.env.UNSUBSCRIBE_TOKEN_SECRET || 'default-secret')
    .update(data)
    .digest('hex')
}
