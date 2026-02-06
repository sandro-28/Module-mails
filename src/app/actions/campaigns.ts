"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Campaign, CampaignInsert, CampaignUpdate, OrganizationMember } from "@/types/database"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single() as { data: Pick<OrganizationMember, "organization_id"> | null; error: unknown }

  if (memberError || !membership) throw new Error("No organization found")
  return membership.organization_id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

// ---------------------------------------------------------------------------
// Create campaign
// ---------------------------------------------------------------------------

export async function createCampaign(
  data: Omit<CampaignInsert, "organization_id">
): Promise<Campaign> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const insertData: CampaignInsert = {
    ...data,
    organization_id: organizationId,
    created_by: user?.id ?? null,
    last_edited_by: user?.id ?? null,
  }

  const { data: campaign, error } = await (supabase
    .from("campaigns")
    .insert(insertData as SupabaseAny)
    .select()
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (error || !campaign) throw new Error(`Failed to create campaign: ${error?.message ?? "Unknown error"}`)

  revalidatePath("/campaigns")
  return campaign
}

// ---------------------------------------------------------------------------
// Update campaign
// ---------------------------------------------------------------------------

export async function updateCampaign(id: string, data: CampaignUpdate): Promise<Campaign> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const updateData: CampaignUpdate = {
    ...data,
    last_edited_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data: campaign, error } = await ((supabase
    .from("campaigns") as SupabaseAny)
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (error || !campaign) throw new Error(`Failed to update campaign: ${error?.message ?? "Unknown error"}`)

  revalidatePath("/campaigns")
  revalidatePath(`/campaigns/${id}`)
  return campaign
}

// ---------------------------------------------------------------------------
// Delete campaign
// ---------------------------------------------------------------------------

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  const { error } = await (supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId) as unknown as Promise<{ error: { message: string } | null }>)

  if (error) throw new Error(`Failed to delete campaign: ${error.message}`)

  revalidatePath("/campaigns")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Send campaign (validate + queue)
// ---------------------------------------------------------------------------

export async function sendCampaign(id: string): Promise<Campaign> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  // Fetch the campaign to validate
  const { data: campaign, error: fetchError } = await (supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (fetchError || !campaign)
    throw new Error("Campaign not found")

  // Validate campaign is ready to send
  const errors: string[] = []
  if (!campaign.subject?.trim()) errors.push("Subject line is required")
  if (!campaign.from_name?.trim()) errors.push("From name is required")
  if (!campaign.from_email?.trim()) errors.push("From email is required")
  if (!campaign.html_content?.trim() && !campaign.template_id)
    errors.push("Email content is required")
  if (campaign.list_ids.length === 0 && campaign.segment_ids.length === 0)
    errors.push("At least one recipient list or segment is required")
  if (campaign.status !== "draft" && campaign.status !== "scheduled")
    errors.push(`Campaign cannot be sent from "${campaign.status}" status`)

  if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`)

  // Update status to sending
  const sendUpdate: CampaignUpdate = {
    status: "sending",
    sending_started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: updated, error: updateError } = await ((supabase
    .from("campaigns") as SupabaseAny)
    .update(sendUpdate)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (updateError || !updated)
    throw new Error(`Failed to queue campaign: ${updateError?.message ?? "Unknown error"}`)

  revalidatePath("/campaigns")
  revalidatePath(`/campaigns/${id}`)
  return updated
}

// ---------------------------------------------------------------------------
// Schedule campaign
// ---------------------------------------------------------------------------

export async function scheduleCampaign(id: string, scheduledAt: string): Promise<Campaign> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  const scheduledDate = new Date(scheduledAt)
  if (scheduledDate <= new Date())
    throw new Error("Scheduled date must be in the future")

  const scheduleUpdate: CampaignUpdate = {
    status: "scheduled",
    scheduled_at: scheduledAt,
    updated_at: new Date().toISOString(),
  }

  const { data: campaign, error } = await ((supabase
    .from("campaigns") as SupabaseAny)
    .update(scheduleUpdate)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (error || !campaign) throw new Error(`Failed to schedule campaign: ${error?.message ?? "Unknown error"}`)

  revalidatePath("/campaigns")
  revalidatePath(`/campaigns/${id}`)
  return campaign
}

// ---------------------------------------------------------------------------
// Cancel scheduled campaign
// ---------------------------------------------------------------------------

export async function cancelSchedule(id: string): Promise<Campaign> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  const cancelUpdate: CampaignUpdate = {
    status: "draft",
    scheduled_at: null,
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: campaign, error } = await ((supabase
    .from("campaigns") as SupabaseAny)
    .update(cancelUpdate)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (error || !campaign) throw new Error(`Failed to cancel schedule: ${error?.message ?? "Unknown error"}`)

  revalidatePath("/campaigns")
  revalidatePath(`/campaigns/${id}`)
  return campaign
}

// ---------------------------------------------------------------------------
// Duplicate campaign
// ---------------------------------------------------------------------------

export async function duplicateCampaign(id: string): Promise<Campaign> {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: original, error: fetchError } = await (supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (fetchError || !original)
    throw new Error("Campaign not found")

  const duplicateData: CampaignInsert = {
    organization_id: organizationId,
    name: `${original.name} (Copy)`,
    description: original.description,
    type: original.type,
    status: "draft",
    subject: original.subject,
    preview_text: original.preview_text,
    from_name: original.from_name,
    from_email: original.from_email,
    reply_to: original.reply_to,
    template_id: original.template_id,
    html_content: original.html_content,
    text_content: original.text_content,
    list_ids: original.list_ids,
    segment_ids: original.segment_ids,
    excluded_list_ids: original.excluded_list_ids,
    excluded_segment_ids: original.excluded_segment_ids,
    tags: original.tags,
    send_config: original.send_config,
    ab_test_config: original.ab_test_config,
    google_analytics_enabled: original.google_analytics_enabled,
    utm_source: original.utm_source,
    utm_medium: original.utm_medium,
    utm_campaign: original.utm_campaign,
    utm_content: original.utm_content,
    utm_term: original.utm_term,
    track_opens: original.track_opens,
    track_clicks: original.track_clicks,
    auto_text_content: original.auto_text_content,
    created_by: user?.id ?? null,
    last_edited_by: user?.id ?? null,
  }

  const { data: duplicate, error: insertError } = await (supabase
    .from("campaigns")
    .insert(duplicateData as SupabaseAny)
    .select()
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (insertError || !duplicate)
    throw new Error(`Failed to duplicate campaign: ${insertError?.message ?? "Unknown error"}`)

  revalidatePath("/campaigns")
  return duplicate
}

// ---------------------------------------------------------------------------
// Send test email
// ---------------------------------------------------------------------------

export async function sendTestEmail(campaignId: string, emails: string[]) {
  const supabase = await createClient()
  const organizationId = await getOrganizationId()

  if (emails.length === 0) throw new Error("At least one email address is required")
  if (emails.length > 5)
    throw new Error("Maximum 5 test email addresses allowed")

  // Validate all emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  for (const email of emails) {
    if (!emailRegex.test(email))
      throw new Error(`Invalid email address: ${email}`)
  }

  // Fetch the campaign
  const { data: campaign, error: fetchError } = await (supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .single() as unknown as Promise<{ data: Campaign | null; error: { message: string } | null }>)

  if (fetchError || !campaign)
    throw new Error("Campaign not found")

  if (!campaign.html_content && !campaign.template_id)
    throw new Error("Campaign has no content to send")

  // In a real implementation, this would call the email sending service.
  // For now, we simulate success.
  return {
    success: true,
    sent_to: emails,
    message: `Test email sent to ${emails.length} recipient(s)`,
  }
}
