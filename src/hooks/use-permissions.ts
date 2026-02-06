"use client"

import { useMemo } from "react"
import { useOrganization, type MemberRole } from "@/hooks/use-organization"

// ---------------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------------

type Permission =
  | "contacts:read"
  | "contacts:write"
  | "contacts:delete"
  | "campaigns:read"
  | "campaigns:write"
  | "campaigns:send"
  | "templates:read"
  | "templates:write"
  | "automations:read"
  | "automations:write"
  | "analytics:read"
  | "lists:read"
  | "lists:write"
  | "segments:read"
  | "segments:write"
  | "forms:read"
  | "forms:write"
  | "members:read"
  | "members:write"
  | "billing:read"
  | "billing:write"
  | "settings:read"
  | "settings:write"
  | "logs:read"

const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: [
    "contacts:read",
    "contacts:write",
    "contacts:delete",
    "campaigns:read",
    "campaigns:write",
    "campaigns:send",
    "templates:read",
    "templates:write",
    "automations:read",
    "automations:write",
    "analytics:read",
    "lists:read",
    "lists:write",
    "segments:read",
    "segments:write",
    "forms:read",
    "forms:write",
    "members:read",
    "members:write",
    "billing:read",
    "billing:write",
    "settings:read",
    "settings:write",
    "logs:read",
  ],
  admin: [
    "contacts:read",
    "contacts:write",
    "contacts:delete",
    "campaigns:read",
    "campaigns:write",
    "campaigns:send",
    "templates:read",
    "templates:write",
    "automations:read",
    "automations:write",
    "analytics:read",
    "lists:read",
    "lists:write",
    "segments:read",
    "segments:write",
    "forms:read",
    "forms:write",
    "members:read",
    "members:write",
    "billing:read",
    "settings:read",
    "settings:write",
    "logs:read",
  ],
  editor: [
    "contacts:read",
    "contacts:write",
    "campaigns:read",
    "campaigns:write",
    "campaigns:send",
    "templates:read",
    "templates:write",
    "automations:read",
    "automations:write",
    "analytics:read",
    "lists:read",
    "lists:write",
    "segments:read",
    "segments:write",
    "forms:read",
    "forms:write",
    "members:read",
    "settings:read",
    "logs:read",
  ],
  viewer: [
    "contacts:read",
    "campaigns:read",
    "templates:read",
    "automations:read",
    "analytics:read",
    "lists:read",
    "segments:read",
    "forms:read",
    "members:read",
    "settings:read",
    "logs:read",
  ],
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UsePermissionsReturn {
  /** The active role for the current user / org membership. */
  role: MemberRole | null
  /** Check a single permission string. */
  hasPermission: (permission: Permission) => boolean
  /** Check whether the user has *any* of the listed permissions. */
  hasAnyPermission: (permissions: Permission[]) => boolean
  /** Convenience booleans */
  canManageContacts: boolean
  canCreateCampaigns: boolean
  canSendCampaigns: boolean
  canViewAnalytics: boolean
  canManageMembers: boolean
  canManageBilling: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { role } = useOrganization()

  return useMemo(() => {
    const permissions = role ? ROLE_PERMISSIONS[role] : []

    const hasPermission = (permission: Permission) =>
      permissions.includes(permission)

    const hasAnyPermission = (perms: Permission[]) =>
      perms.some((p) => permissions.includes(p))

    return {
      role,
      hasPermission,
      hasAnyPermission,
      canManageContacts: hasPermission("contacts:write"),
      canCreateCampaigns: hasPermission("campaigns:write"),
      canSendCampaigns: hasPermission("campaigns:send"),
      canViewAnalytics: hasPermission("analytics:read"),
      canManageMembers: hasPermission("members:write"),
      canManageBilling: hasPermission("billing:write"),
    }
  }, [role])
}
