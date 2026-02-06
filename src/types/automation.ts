export type AutomationStatus = "draft" | "active" | "paused" | "archived";

export type TriggerType =
  | "contact_created"
  | "contact_added_to_list"
  | "contact_tag_added"
  | "form_submitted"
  | "email_opened"
  | "email_clicked"
  | "date_field"
  | "engagement_score_change"
  | "webhook"
  | "manual";

export type StepType =
  | "send_email"
  | "delay"
  | "condition"
  | "add_tag"
  | "remove_tag"
  | "add_to_list"
  | "remove_from_list"
  | "update_field"
  | "webhook"
  | "notify"
  | "end";

export interface TriggerConfig {
  type: TriggerType;
  list_id?: string;
  tag?: string;
  form_id?: string;
  campaign_id?: string;
  link_url?: string;
  field?: string;
  offset_days?: number;
  direction?: "above" | "below";
  threshold?: number;
  webhook_url?: string;
  source_filter?: string;
}

export interface AutomationStep {
  id: string;
  type: StepType;
  config: StepConfig;
  next?: string | null;
  next_true?: string;
  next_false?: string;
}

export type StepConfig =
  | SendEmailConfig
  | DelayConfig
  | ConditionConfig
  | TagConfig
  | ListConfig
  | UpdateFieldConfig
  | WebhookConfig
  | NotifyConfig
  | Record<string, never>;

export interface SendEmailConfig {
  template_id: string;
  subject?: string;
  from_name?: string;
  from_email?: string;
}

export interface DelayConfig {
  duration: number;
  unit: "minutes" | "hours" | "days" | "weeks";
}

export interface ConditionConfig {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface TagConfig {
  tag: string;
}

export interface ListConfig {
  list_id: string;
}

export interface UpdateFieldConfig {
  field: string;
  value: string;
}

export interface WebhookConfig {
  url: string;
  method: "GET" | "POST";
  payload?: Record<string, unknown>;
}

export interface NotifyConfig {
  member_id: string;
  message: string;
}

export interface EnrollmentStepHistory {
  step_id: string;
  executed_at: string;
  result: string;
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  contact_created: "New Contact Created",
  contact_added_to_list: "Contact Added to List",
  contact_tag_added: "Tag Added to Contact",
  form_submitted: "Form Submitted",
  email_opened: "Email Opened",
  email_clicked: "Link Clicked",
  date_field: "Date Field Trigger",
  engagement_score_change: "Engagement Score Change",
  webhook: "Webhook Received",
  manual: "Manual Trigger",
};

export const STEP_LABELS: Record<StepType, string> = {
  send_email: "Send Email",
  delay: "Wait / Delay",
  condition: "If/Else Condition",
  add_tag: "Add Tag",
  remove_tag: "Remove Tag",
  add_to_list: "Add to List",
  remove_from_list: "Remove from List",
  update_field: "Update Field",
  webhook: "Call Webhook",
  notify: "Notify Team Member",
  end: "End Workflow",
};
