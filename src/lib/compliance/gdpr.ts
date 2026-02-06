import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Export all data for a contact (GDPR Right of Access / Portability).
 * Returns a comprehensive JSON object containing all data associated
 * with the contact.
 */
export async function exportContactData(
  contactId: string,
  organizationId: string,
): Promise<Record<string, unknown>> {
  const supabase = createAdminClient()

  // Fetch contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .single()

  if (!contact) {
    throw new Error('Contact not found')
  }

  // Fetch list memberships
  const { data: listMemberships } = await supabase
    .from('list_contacts')
    .select('list_id, status, subscribed_at, unsubscribed_at, source')
    .eq('contact_id', contactId)

  // Fetch email events
  const { data: events } = await supabase
    .from('email_events')
    .select('event_type, timestamp, metadata')
    .eq('contact_id', contactId)
    .eq('organization_id', organizationId)
    .order('timestamp', { ascending: false })

  // Fetch campaign emails
  const { data: campaignEmails } = await supabase
    .from('campaign_emails')
    .select('campaign_id, status, sent_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, open_count, click_count')
    .eq('contact_id', contactId)
    .order('sent_at', { ascending: false })

  // Fetch link clicks
  const { data: linkClicks } = await supabase
    .from('link_clicks')
    .select('tracked_link_id, clicked_at, device_type, browser, os')
    .eq('contact_id', contactId)
    .order('clicked_at', { ascending: false })

  // Fetch automation enrollments
  const { data: enrollments } = await supabase
    .from('automation_enrollments')
    .select('automation_id, status, enrolled_at, completed_at, exited_at, steps_completed, emails_sent')
    .eq('contact_id', contactId)

  // Fetch suppression entries
  const { data: suppressionEntries } = await supabase
    .from('suppression_list')
    .select('reason, source, campaign_id, created_at')
    .eq('organization_id', organizationId)
    .eq('email_address', contact.email)

  // Create audit log
  await supabase.from('audit_logs').insert({
    organization_id: organizationId,
    action: 'contact.data_exported',
    resource_type: 'contact',
    resource_id: contactId,
    description: `GDPR data export for contact ${contact.email}`,
    metadata: { email: contact.email },
  })

  return {
    exported_at: new Date().toISOString(),
    contact: {
      id: contact.id,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      full_name: contact.full_name,
      phone: contact.phone,
      company: contact.company,
      job_title: contact.job_title,
      status: contact.status,
      source: contact.source,
      tags: contact.tags,
      custom_fields: contact.custom_fields,
      language: contact.language,
      timezone: contact.timezone,
      engagement_score: contact.engagement_score,
      subscribed_at: contact.subscribed_at,
      unsubscribed_at: contact.unsubscribed_at,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      geo_country: contact.geo_country,
      geo_region: contact.geo_region,
      geo_city: contact.geo_city,
    },
    list_memberships: listMemberships ?? [],
    email_events: events ?? [],
    campaign_emails: campaignEmails ?? [],
    link_clicks: linkClicks ?? [],
    automation_enrollments: enrollments ?? [],
    suppression_entries: suppressionEntries ?? [],
  }
}

/**
 * Delete all data for a contact (GDPR Right to Erasure).
 * Removes all associated data: events, emails, list memberships,
 * automation enrollments, link clicks, and the contact record itself.
 */
export async function deleteContactData(
  contactId: string,
  organizationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Get contact info for audit before deletion
    const { data: contact } = await supabase
      .from('contacts')
      .select('email, email_hash')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (!contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Delete in order of dependencies

    // 1. Delete automation enrollments
    await supabase
      .from('automation_enrollments')
      .delete()
      .eq('contact_id', contactId)

    // 2. Delete link clicks
    await supabase
      .from('link_clicks')
      .delete()
      .eq('contact_id', contactId)

    // 3. Delete email events
    await supabase
      .from('email_events')
      .delete()
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)

    // 4. Delete campaign emails
    await supabase
      .from('campaign_emails')
      .delete()
      .eq('contact_id', contactId)

    // 5. Delete list memberships
    await supabase
      .from('list_contacts')
      .delete()
      .eq('contact_id', contactId)

    // 6. Delete suppression entries for this email
    await supabase
      .from('suppression_list')
      .delete()
      .eq('organization_id', organizationId)
      .eq('email_address', contact.email)

    // 7. Delete the contact itself
    await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('organization_id', organizationId)

    // Create audit log (after deletion, the contact data is gone)
    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      action: 'contact.deleted_gdpr',
      resource_type: 'contact',
      resource_id: contactId,
      description: `GDPR erasure of contact data. Email hash: ${contact.email_hash}`,
      metadata: {
        email_hash: contact.email_hash,
        reason: 'gdpr_erasure_request',
      },
    })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
