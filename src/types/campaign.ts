export type CampaignType = "regular" | "ab_test" | "automated" | "transactional" | "rss";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled" | "failed";

export interface CampaignStatsJson {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  unique_opens: number;
  total_clicked: number;
  unique_clicks: number;
  total_bounced: number;
  hard_bounces: number;
  soft_bounces: number;
  total_unsubscribed: number;
  total_complained: number;
  total_forwarded: number;
  revenue_generated: number;
}

export interface ABTestConfig {
  enabled: boolean;
  variable: "subject" | "from_name" | "content" | "send_time";
  variants: ABTestVariant[];
  test_size_percent: number;
  winner_criteria: "open_rate" | "click_rate";
  winner_wait_hours: number;
  winner_selected: string | null;
}

export interface ABTestVariant {
  id: string;
  subject?: string;
  from_name?: string;
  content?: string;
  weight: number;
}

export interface CampaignWizardData {
  // Step 1 - Settings
  name: string;
  type: CampaignType;
  subject: string;
  preview_text: string;
  from_name: string;
  from_email: string;
  reply_to: string;

  // Step 2 - Content
  template_id: string | null;
  html_content: string;
  text_content: string;

  // Step 3 - Recipients
  recipient_type: "list" | "segment" | "all" | "manual";
  recipient_list_ids: string[];
  recipient_segment_ids: string[];
  exclude_list_ids: string[];
  exclude_segment_ids: string[];

  // Step 4 - Schedule
  send_now: boolean;
  scheduled_at: string | null;
  timezone: string;

  // Step 5 - A/B Test
  ab_test_config: ABTestConfig | null;

  // UTM
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
  cancelled: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  paused: "Paused",
  cancelled: "Cancelled",
  failed: "Failed",
};
