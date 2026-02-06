import { createClient } from '@/lib/supabase/server'
import type { Role } from './permissions'

export interface TenantContext {
  user: {
    id: string
    email: string
    user_metadata: Record<string, unknown>
  }
  organization: {
    id: string
    name: string
    slug: string
    plan: string
    [key: string]: unknown
  }
  membership: {
    id: string
    user_id: string
    organization_id: string
    role: Role
    [key: string]: unknown
  }
  organizationId: string
  role: Role
}

/**
 * Server-side function to get the current user's organization context.
 * Returns null if the user is not authenticated or has no organization membership.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    return null
  }

  const organization = (membership as Record<string, unknown>).organizations as TenantContext['organization']

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      user_metadata: user.user_metadata ?? {},
    },
    organization,
    membership: {
      id: membership.id,
      user_id: membership.user_id,
      organization_id: membership.organization_id,
      role: membership.role as Role,
    },
    organizationId: membership.organization_id,
    role: membership.role as Role,
  }
}

/**
 * Server-side function to require tenant context.
 * Throws a redirect to login if the user is not authenticated.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext()

  if (!context) {
    // Dynamic import to avoid issues in non-Next.js contexts
    const { redirect } = await import('next/navigation')
    redirect('/login')
    // redirect() throws, but TypeScript can't infer that
    throw new Error('Unreachable')
  }

  return context
}
