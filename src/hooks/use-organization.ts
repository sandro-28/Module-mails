"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { createElement } from "react"
import { createClient } from "@/lib/supabase/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemberRole = "owner" | "admin" | "editor" | "viewer"

export type PlanTier = "free" | "starter" | "growth" | "enterprise"

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: PlanTier
  contact_limit: number
  email_limit: number
  created_at: string
}

export interface Membership {
  id: string
  user_id: string
  organization_id: string
  role: MemberRole
  created_at: string
}

export interface OrganizationUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface OrganizationContextValue {
  organization: Organization | null
  membership: Membership | null
  user: OrganizationUser | null
  role: MemberRole | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface OrganizationProviderProps {
  children: ReactNode
  /** Pre-fetched data from the server can be passed in to avoid an extra
   *  client-side round-trip. */
  initialOrganization?: Organization | null
  initialMembership?: Membership | null
  initialUser?: OrganizationUser | null
}

export function OrganizationProvider({
  children,
  initialOrganization = null,
  initialMembership = null,
  initialUser = null,
}: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(
    initialOrganization
  )
  const [membership, setMembership] = useState<Membership | null>(
    initialMembership
  )
  const [user, setUser] = useState<OrganizationUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialOrganization)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setOrganization(null)
        setMembership(null)
        setUser(null)
        return
      }

      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        full_name: authUser.user_metadata?.full_name ?? null,
        avatar_url: authUser.user_metadata?.avatar_url ?? null,
      })

      // Fetch the user's first organisation membership
      const { data: membershipRow, error: membershipError } = await supabase
        .from("organization_members")
        .select("*, organizations(*)")
        .eq("user_id", authUser.id)
        .limit(1)
        .single()

      if (membershipError) {
        setError("Unable to load organisation data.")
        return
      }

      if (membershipRow) {
        const org = membershipRow.organizations as unknown as Organization
        setOrganization(org)
        setMembership({
          id: membershipRow.id,
          user_id: membershipRow.user_id,
          organization_id: membershipRow.organization_id,
          role: membershipRow.role as MemberRole,
          created_at: membershipRow.created_at,
        })
      }
    } catch {
      setError("Something went wrong while loading organisation data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch if we were not given initial data
    if (!initialOrganization) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: OrganizationContextValue = {
    organization,
    membership,
    user,
    role: membership?.role ?? null,
    isLoading,
    error,
    refresh,
  }

  return createElement(
    OrganizationContext.Provider,
    { value },
    children
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    )
  }
  return context
}
