export type TemplateCategory =
  | "custom"
  | "newsletter"
  | "promotion"
  | "transactional"
  | "welcome"
  | "notification"
  | "event"
  | "survey";

export type DesignMode = "builder" | "code" | "react";

export interface TemplateBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  styles: Record<string, string | number>;
  order: number;
}

export type BlockType =
  | "header"
  | "text"
  | "image"
  | "button"
  | "columns"
  | "divider"
  | "spacer"
  | "social"
  | "product"
  | "video"
  | "menu"
  | "html"
  | "footer";

export interface MergeTag {
  key: string;
  label: string;
  example: string;
  category: string;
}

export const AVAILABLE_MERGE_TAGS: MergeTag[] = [
  { key: "{{contact.first_name}}", label: "First Name", example: "John", category: "Contact" },
  { key: "{{contact.last_name}}", label: "Last Name", example: "Doe", category: "Contact" },
  { key: "{{contact.email}}", label: "Email", example: "john@example.com", category: "Contact" },
  { key: "{{contact.company}}", label: "Company", example: "Acme Inc.", category: "Contact" },
  { key: "{{contact.city}}", label: "City", example: "Paris", category: "Contact" },
  { key: "{{contact.country}}", label: "Country", example: "France", category: "Contact" },
  { key: "{{organization.name}}", label: "Organization Name", example: "MailForge", category: "Organization" },
  { key: "{{organization.website}}", label: "Website", example: "https://mailforge.io", category: "Organization" },
  { key: "{{campaign.subject}}", label: "Campaign Subject", example: "Newsletter", category: "Campaign" },
  { key: "{{unsubscribe_url}}", label: "Unsubscribe URL", example: "#", category: "Links" },
  { key: "{{preferences_url}}", label: "Preferences URL", example: "#", category: "Links" },
  { key: "{{view_in_browser_url}}", label: "View in Browser", example: "#", category: "Links" },
];

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  custom: "Custom",
  newsletter: "Newsletter",
  promotion: "Promotion",
  transactional: "Transactional",
  welcome: "Welcome",
  notification: "Notification",
  event: "Event",
  survey: "Survey",
};
