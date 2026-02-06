import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContactDetailClient } from "./contact-detail-client"
import {
  type ContactEvent,
  type ContactCampaign,
  type ContactList,
} from "@/app/actions/contacts"
import { mapEmailEventToContactEvent } from "@/lib/utils/contact-mappers"
import type { Contact, EmailEvent } from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: contact } = await supabase
    .from("contacts")
    .select("email, first_name, last_name")
    .eq("id", id)
    .single()

  if (!contact) {
    return { title: "Contact Not Found | MailForge" }
  }

  const name = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ")
  return {
    title: `${name || contact.email} | Contacts | MailForge`,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ContactDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Authenticate and get organization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">Please sign in to view this contact.</p>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">No organization found.</p>
      </div>
    )
  }

  const organizationId = membership.organization_id

  // Fetch contact with org isolation
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single()

  if (contactError || !contact) {
    notFound()
  }

  // Fetch recent events (first page) from email_events
  const { data: rawEvents, count: totalEvents } = await supabase
    .from("email_events")
    .select("*", { count: "exact" })
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .range(0, 19)

  // Map email_events rows to the ContactEvent shape
  const events: ContactEvent[] = (rawEvents as EmailEvent[] | null ?? []).map(
    mapEmailEventToContactEvent
  )

  // Fetch campaigns this contact received (campaign_emails table)
  const { data: campaignEmails } = await supabase
    .from("campaign_emails")
    .select(
      `
      id,
      campaign_id,
      status,
      sent_at,
      first_opened_at,
      first_clicked_at,
      campaigns (
        id,
        name,
        subject
      )
    `
    )
    .eq("contact_id", id)
    .order("sent_at", { ascending: false })

  const campaigns: ContactCampaign[] = (campaignEmails ?? []).map((r) => {
    const campaign = r.campaigns as unknown as {
      id: string
      name: string
      subject: string
    } | null
    return {
      id: r.id,
      campaign_id: campaign?.id ?? r.campaign_id,
      campaign_name: campaign?.name ?? "Unknown Campaign",
      subject: campaign?.subject ?? "",
      status: r.status,
      sent_at: r.sent_at,
      opened_at: r.first_opened_at,
      clicked_at: r.first_clicked_at,
    }
  })

  // Fetch lists for this contact (list_contacts table)
  const { data: listMemberships } = await supabase
    .from("list_contacts")
    .select(
      `
      id,
      list_id,
      lists (
        id,
        name,
        description
      )
    `
    )
    .eq("contact_id", id)

  const contactLists: ContactList[] = (listMemberships ?? []).map((m) => {
    const list = m.lists as unknown as {
      id: string
      name: string
      description: string | null
    } | null
    return {
      id: list?.id ?? m.list_id,
      name: list?.name ?? "Unknown List",
      description: list?.description ?? null,
      contact_count: 0,
    }
  })

  // Fetch all available lists for adding
  const { data: allLists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name")

  return (
    <ContactDetailClient
      contact={contact as Contact}
      events={events}
      totalEvents={totalEvents ?? 0}
      campaigns={campaigns}
      contactLists={contactLists}
      allLists={(allLists as { id: string; name: string }[]) ?? []}
    />
  )
}
