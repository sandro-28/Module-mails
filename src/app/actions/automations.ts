"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  AutomationTriggerType,
  AutomationTriggerConfig,
  AutomationStep,
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

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createAutomation(data: {
  name: string
  description?: string
  trigger_type: AutomationTriggerType
  trigger_config: AutomationTriggerConfig
  steps: AutomationStep[]
}) {
  const supabase = await createClient()
  const orgId = await getOrgId()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: automation, error } = await supabase
    .from("automations")
    .insert({
      organization_id: orgId,
      name: data.name,
      description: data.description ?? null,
      trigger_type: data.trigger_type,
      trigger_config: data.trigger_config,
      steps: data.steps,
      status: "draft",
      created_by: user.id,
      last_edited_by: user.id,
    })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/automations")
  return { success: true, id: automation.id }
}

export async function updateAutomation(
  id: string,
  data: {
    name?: string
    description?: string
    trigger_type?: AutomationTriggerType
    trigger_config?: AutomationTriggerConfig
    steps?: AutomationStep[]
  }
) {
  const supabase = await createClient()
  const orgId = await getOrgId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("automations")
    .update({
      ...data,
      last_edited_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/automations")
  revalidatePath(`/automations/${id}`)
  return { success: true }
}

export async function deleteAutomation(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("automations")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/automations")
  return { success: true }
}

export async function activateAutomation(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("automations")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/automations")
  revalidatePath(`/automations/${id}`)
  return { success: true }
}

export async function pauseAutomation(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()

  const { error } = await supabase
    .from("automations")
    .update({
      status: "paused",
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/automations")
  revalidatePath(`/automations/${id}`)
  return { success: true }
}

export async function duplicateAutomation(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Fetch the original automation
  const { data: original, error: fetchError } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single()

  if (fetchError || !original) {
    return { success: false, error: fetchError?.message ?? "Automation not found" }
  }

  const { data: duplicate, error } = await supabase
    .from("automations")
    .insert({
      organization_id: orgId,
      name: `${original.name} (Copy)`,
      description: original.description,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config,
      steps: original.steps,
      entry_conditions: original.entry_conditions,
      exit_conditions: original.exit_conditions,
      goal_conditions: original.goal_conditions,
      allow_re_entry: original.allow_re_entry,
      re_entry_delay_hours: original.re_entry_delay_hours,
      max_enrollments_per_contact: original.max_enrollments_per_contact,
      status: "draft",
      created_by: user.id,
      last_edited_by: user.id,
    })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/automations")
  return { success: true, id: duplicate.id }
}
