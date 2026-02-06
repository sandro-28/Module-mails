import { createAdminClient } from '@/lib/supabase/admin'
import { hashApiKey } from '@/lib/utils/crypto'
import type { Role } from './permissions'

export interface ApiAuthContext {
  organizationId: string
  apiKeyId: string
  role: Role
  organization: {
    id: string
    name: string
    slug: string
    plan: string
    [key: string]: unknown
  }
}

export interface ApiAuthResult {
  success: true
  context: ApiAuthContext
}

export interface ApiAuthError {
  success: false
  error: string
  status: number
}

/**
 * Authenticate an API request using a Bearer token.
 * Looks up the hashed key in the api_keys table and returns the associated
 * organization context.
 *
 * Usage in a route handler:
 * ```ts
 * const auth = await authenticateApiRequest(request)
 * if (!auth.success) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status })
 * }
 * const { context } = auth
 * ```
 */
export async function authenticateApiRequest(
  request: Request
): Promise<ApiAuthResult | ApiAuthError> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return {
      success: false,
      error: 'Missing Authorization header. Provide a Bearer token.',
      status: 401,
    }
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return {
      success: false,
      error: 'Invalid Authorization header format. Expected: Bearer <api_key>',
      status: 401,
    }
  }

  const apiKey = parts[1]

  if (!apiKey || !apiKey.startsWith('mf_')) {
    return {
      success: false,
      error: 'Invalid API key format.',
      status: 401,
    }
  }

  const hashedKey = hashApiKey(apiKey)
  const supabase = createAdminClient()

  const { data: keyRecord, error: keyError } = await supabase
    .from('api_keys')
    .select('id, organization_id, name, scopes, is_active, last_used_at')
    .eq('key_hash', hashedKey)
    .single()

  if (keyError || !keyRecord) {
    return {
      success: false,
      error: 'Invalid API key.',
      status: 401,
    }
  }

  if (!keyRecord.is_active) {
    return {
      success: false,
      error: 'API key has been revoked.',
      status: 403,
    }
  }

  // Update last_used_at timestamp (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)
    .then(() => {})

  // Fetch the associated organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', keyRecord.organization_id)
    .single()

  if (orgError || !organization) {
    return {
      success: false,
      error: 'Organization not found for this API key.',
      status: 403,
    }
  }

  return {
    success: true,
    context: {
      organizationId: keyRecord.organization_id,
      apiKeyId: keyRecord.id,
      role: 'api_only' as Role,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
    },
  }
}
