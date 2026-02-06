import type { EmailEvent } from "@/types/database"
import type { ContactEvent } from "@/app/actions/contacts"

/** Map an email_events row into the ContactEvent shape used by the timeline. */
export function mapEmailEventToContactEvent(row: EmailEvent): ContactEvent {
  const descriptionMap: Record<string, string> = {
    sent: "Email was sent",
    delivered: "Email was delivered",
    opened: "Email was opened",
    clicked: "Link was clicked",
    bounced: "Email bounced",
    complained: "Recipient filed a complaint",
    unsubscribed: "Contact unsubscribed",
    forwarded: "Email was forwarded",
    converted: "Conversion recorded",
    revenue: "Revenue attributed",
  }
  return {
    id: row.id,
    contact_id: row.contact_id,
    type: row.event_type,
    description: descriptionMap[row.event_type] ?? `Event: ${row.event_type}`,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at,
  }
}
