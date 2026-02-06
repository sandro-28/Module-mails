export type Role = 'owner' | 'admin' | 'editor' | 'viewer' | 'api_only'

export type Permission =
  | 'contacts:read'
  | 'contacts:write'
  | 'campaigns:read'
  | 'campaigns:write'
  | 'campaigns:send'
  | 'templates:read'
  | 'templates:write'
  | 'analytics:read'
  | 'members:read'
  | 'members:write'
  | 'billing:read'
  | 'billing:write'
  | 'api:manage'
  | 'export:data'
  | 'automations:read'
  | 'automations:write'

const ALL_PERMISSIONS: Permission[] = [
  'contacts:read',
  'contacts:write',
  'campaigns:read',
  'campaigns:write',
  'campaigns:send',
  'templates:read',
  'templates:write',
  'analytics:read',
  'members:read',
  'members:write',
  'billing:read',
  'billing:write',
  'api:manage',
  'export:data',
  'automations:read',
  'automations:write',
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [...ALL_PERMISSIONS],

  admin: [
    'contacts:read',
    'contacts:write',
    'campaigns:read',
    'campaigns:write',
    'campaigns:send',
    'templates:read',
    'templates:write',
    'analytics:read',
    'members:read',
    'members:write',
    'billing:read',
    'api:manage',
    'export:data',
    'automations:read',
    'automations:write',
  ],

  editor: [
    'contacts:read',
    'contacts:write',
    'campaigns:read',
    'campaigns:write',
    'templates:read',
    'templates:write',
    'analytics:read',
    'automations:read',
    'automations:write',
  ],

  viewer: [
    'contacts:read',
    'campaigns:read',
    'templates:read',
    'analytics:read',
    'automations:read',
  ],

  api_only: [
    'contacts:read',
    'contacts:write',
    'campaigns:read',
  ],
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * Check if a role has at least one of the given permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a role has all of the given permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Hierarchy of roles from most to least privileged.
 */
const ROLE_HIERARCHY: Role[] = ['owner', 'admin', 'editor', 'viewer', 'api_only']

/**
 * Check if roleA is at least as privileged as roleB.
 */
export function isRoleAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) <= ROLE_HIERARCHY.indexOf(roleB)
}
