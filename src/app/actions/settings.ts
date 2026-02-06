"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  OrganizationMemberRole,
  WebhookEventType,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  if (!member) throw new Error("No organization found")
  return member.organization_id
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let key = "mf_live_"
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let secret = "whsec_"
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export async function updateOrganization(data: {
  name?: string
  slug?: string
  website?: string
  default_from_name?: string
  default_from_email?: string
  default_reply_to?: string
  timezone?: string
  logo_url?: string
}) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("organizations")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

export async function inviteMember(email: string, role: OrganizationMemberRole) {
  const supabase = await createClient()
  const orgId = await getOrgId()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase.from("organization_members").insert({
    organization_id: orgId,
    user_id: user.id,
    role,
    invited_email: email,
    invited_at: new Date().toISOString(),
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/team")
  return { success: true }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/team")
  return { success: true }
}

export async function updateMemberRole(
  memberId: string,
  role: OrganizationMemberRole
) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("organization_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/team")
  return { success: true }
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export async function createApiKey(
  name: string,
  permissions: string[]
) {
  const supabase = await createClient()
  const orgId = await getOrgId()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const rawKey = generateApiKey()
  const keyHash = await hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12) + "..."

  const { error } = await supabase.from("api_keys").insert({
    organization_id: orgId,
    user_id: user.id,
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    scopes: permissions,
    is_active: true,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/api")
  return { success: true, key: rawKey }
}

export async function revokeApiKey(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/api")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export async function createWebhook(
  url: string,
  events: WebhookEventType[],
  name?: string
) {
  const supabase = await createClient()
  const orgId = await getOrgId()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const secret = generateSecret()

  const { error } = await supabase.from("webhooks").insert({
    organization_id: orgId,
    name: name || url,
    url,
    secret,
    events,
    is_active: true,
    created_by: user.id,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/webhooks")
  return { success: true, secret }
}

export async function deleteWebhook(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/webhooks")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

export async function updateBranding(data: {
  logo_url?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("organizations")
    .update({
      logo_url: data.logo_url,
      metadata: data.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/branding")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Domain verification
// ---------------------------------------------------------------------------

export async function verifyDomain(domain: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  // In production this would make DNS lookups via an API.
  // For now, persist the domain and simulate a pending state.
  const { error } = await supabase
    .from("organizations")
    .update({
      sending_domain: domain,
      domain_verified: false,
      dkim_verified: false,
      spf_verified: false,
      dmarc_verified: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/domain")
  return {
    success: true,
    records: {
      dkim: {
        type: "CNAME" as const,
        name: `mf._domainkey.${domain}`,
        value: `mf._domainkey.mailforge.app`,
        status: "pending" as const,
      },
      spf: {
        type: "TXT" as const,
        name: domain,
        value: `v=spf1 include:spf.mailforge.app ~all`,
        status: "pending" as const,
      },
      dmarc: {
        type: "TXT" as const,
        name: `_dmarc.${domain}`,
        value: `v=DMARC1; p=none; rua=mailto:dmarc@mailforge.app`,
        status: "pending" as const,
      },
      returnPath: {
        type: "CNAME" as const,
        name: `bounce.${domain}`,
        value: `bounce.mailforge.app`,
        status: "pending" as const,
      },
    },
  }
}
