import { createAdminClient } from '@/lib/supabase/admin'
import { hashEmail } from '@/lib/utils/email-validator'

/**
 * Process an unsubscribe request for a contact.
 *
 * - Updates the contact status to 'unsubscribed'
 * - Adds the email to the suppression list
 * - Creates an audit log entry
 * - Creates an email event record
 */
export async function processUnsubscribe(
  contactId: string,
  organizationId: string,
  campaignId?: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  try {
    // Get contact info
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('email, email_hash')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Update contact status
    await supabase
      .from('contacts')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: now,
        updated_at: now,
      })
      .eq('id', contactId)

    // Update all list memberships to unsubscribed
    await supabase
      .from('list_contacts')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: now,
      })
      .eq('contact_id', contactId)

    // Add to suppression list
    await supabase.from('suppression_list').upsert(
      {
        organization_id: organizationId,
        email_address: contact.email,
        email_hash: contact.email_hash || hashEmail(contact.email),
        reason: 'unsubscribed',
        campaign_id: campaignId || null,
        source: 'user_request',
        source_detail: reason || 'unsubscribe_page',
      },
      { onConflict: 'organization_id,email_hash' },
    )

    // Create email event
    await supabase.from('email_events').insert({
      organization_id: organizationId,
      contact_id: contactId,
      campaign_id: campaignId || null,
      email_address: contact.email,
      event_type: 'unsubscribed',
      timestamp: now,
      metadata: {
        reason: reason || 'user_request',
      },
    })

    // Create audit log
    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      action: 'contact.unsubscribed',
      resource_type: 'contact',
      resource_id: contactId,
      description: `Contact ${contact.email} unsubscribed. Reason: ${reason || 'user_request'}`,
      metadata: {
        email: contact.email,
        reason: reason || 'user_request',
        campaign_id: campaignId,
      },
    })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
