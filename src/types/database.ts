// =============================================================================
// MailForge Database Schema Types
// Generated for Supabase PostgreSQL — the backbone of the application.
// =============================================================================

// -----------------------------------------------------------------------------
// Enum Union Types
// -----------------------------------------------------------------------------

export type OrganizationPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export type OrganizationMemberRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'viewer'
  | 'api_only';

export type ContactStatus =
  | 'active'
  | 'unsubscribed'
  | 'bounced'
  | 'complained'
  | 'cleaned'
  | 'pending';

export type ListType = 'static' | 'dynamic';

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'url'
  | 'phone';

export type DesignMode = 'builder' | 'code' | 'react';

export type TemplateCategory =
  | 'custom'
  | 'newsletter'
  | 'promotion'
  | 'transactional'
  | 'welcome'
  | 'notification'
  | 'event'
  | 'survey';

export type CampaignType =
  | 'regular'
  | 'ab_test'
  | 'automated'
  | 'transactional'
  | 'rss';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled'
  | 'failed';

export type CampaignEmailStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed'
  | 'forwarded'
  | 'converted'
  | 'revenue';

export type SuppressionReason =
  | 'unsubscribed'
  | 'hard_bounce'
  | 'complaint'
  | 'manual'
  | 'list_unsubscribe';

export type SignupFormType =
  | 'embedded'
  | 'popup'
  | 'landing'
  | 'flyout'
  | 'bar';

export type AutomationStatus = 'draft' | 'active' | 'paused' | 'archived';

export type AutomationTriggerType =
  | 'contact_created'
  | 'contact_added_to_list'
  | 'contact_tag_added'
  | 'form_submitted'
  | 'email_opened'
  | 'email_clicked'
  | 'date_field'
  | 'engagement_score_change'
  | 'webhook'
  | 'manual';

export type AutomationEnrollmentStatus =
  | 'active'
  | 'completed'
  | 'exited'
  | 'paused'
  | 'failed';

export type BounceType = 'hard' | 'soft';

export type WebhookEventType =
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'contact.subscribed'
  | 'contact.unsubscribed'
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained'
  | 'campaign.sent'
  | 'campaign.completed'
  | 'form.submitted'
  | 'automation.enrolled'
  | 'automation.completed';

// -----------------------------------------------------------------------------
// JSON / Composite Types
// -----------------------------------------------------------------------------

/** Aggregate statistics stored on the campaign row. */
export type CampaignStats = {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  unique_opens: number;
  clicked: number;
  unique_clicks: number;
  bounced: number;
  hard_bounced: number;
  soft_bounced: number;
  complained: number;
  unsubscribed: number;
  forwarded: number;
  converted: number;
  revenue: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  complaint_rate: number;
  unsubscribe_rate: number;
};

/** A/B test configuration stored as JSON on the campaign. */
export type AbTestConfig = {
  variants: AbTestVariant[];
  test_metric: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  test_duration_hours: number;
  test_sample_percentage: number;
  winning_criteria: 'automatic' | 'manual';
  winner_variant_id: string | null;
  confidence_level: number;
};

export type AbTestVariant = {
  id: string;
  name: string;
  subject: string | null;
  preview_text: string | null;
  from_name: string | null;
  from_email: string | null;
  template_id: string | null;
  html_content: string | null;
  weight: number;
  stats: CampaignStats | null;
};

/** Automation step definition (stored as JSON array on the automation). */
export type AutomationStep =
  | AutomationStepSendEmail
  | AutomationStepDelay
  | AutomationStepCondition
  | AutomationStepAction
  | AutomationStepSplit
  | AutomationStepWebhook
  | AutomationStepGoTo;

export type AutomationStepBase = {
  id: string;
  name: string;
  position: number;
};

export type AutomationStepSendEmail = AutomationStepBase & {
  type: 'send_email';
  config: {
    template_id: string;
    subject: string;
    from_name: string;
    from_email: string;
    preview_text: string | null;
    reply_to: string | null;
    delay_after?: DelayConfig;
  };
};

export type AutomationStepDelay = AutomationStepBase & {
  type: 'delay';
  config: DelayConfig;
};

export type DelayConfig = {
  duration: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
};

export type AutomationStepCondition = AutomationStepBase & {
  type: 'condition';
  config: {
    conditions: SegmentConditionGroup;
    yes_branch_step_id: string;
    no_branch_step_id: string;
  };
};

export type AutomationStepAction = AutomationStepBase & {
  type: 'action';
  config: {
    action:
      | 'add_to_list'
      | 'remove_from_list'
      | 'add_tag'
      | 'remove_tag'
      | 'update_field'
      | 'unsubscribe'
      | 'mark_as_converted';
    list_id?: string;
    tag?: string;
    field_key?: string;
    field_value?: string;
  };
};

export type AutomationStepSplit = AutomationStepBase & {
  type: 'random_split';
  config: {
    branches: {
      id: string;
      name: string;
      percentage: number;
      next_step_id: string;
    }[];
  };
};

export type AutomationStepWebhook = AutomationStepBase & {
  type: 'webhook';
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH';
    headers: Record<string, string>;
    body_template: string | null;
  };
};

export type AutomationStepGoTo = AutomationStepBase & {
  type: 'go_to';
  config: {
    target_step_id: string;
  };
};

/** Trigger configuration stored as JSON on the automation. */
export type AutomationTriggerConfig = {
  trigger_type: AutomationTriggerType;
  list_id?: string;
  tag?: string;
  form_id?: string;
  campaign_id?: string;
  link_url?: string;
  date_field_key?: string;
  date_offset_days?: number;
  date_offset_direction?: 'before' | 'after';
  score_threshold?: number;
  score_direction?: 'above' | 'below';
  webhook_secret?: string;
  filter_conditions?: SegmentConditionGroup;
};

/** Segment conditions — recursive group of rules. */
export type SegmentConditionGroup = {
  operator: 'and' | 'or';
  conditions: (SegmentCondition | SegmentConditionGroup)[];
};

export type SegmentCondition = {
  field: string;
  operator: SegmentOperator;
  value: string | number | boolean | string[] | null;
};

export type SegmentOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'is_set'
  | 'is_not_set'
  | 'in'
  | 'not_in'
  | 'between'
  | 'before'
  | 'after'
  | 'within_last'
  | 'not_within_last';

/** Signup form configuration stored as JSON. */
export type SignupFormConfig = {
  fields: SignupFormField[];
  submit_button_text: string;
  success_message: string;
  redirect_url: string | null;
  double_opt_in: boolean;
  confirmation_email_template_id: string | null;
  recaptcha_enabled: boolean;
  recaptcha_site_key: string | null;
  honeypot_enabled: boolean;
  tags_to_apply: string[];
  lists_to_add: string[];
};

export type SignupFormField = {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'hidden';
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  default_value: string | null;
  custom_field_id: string | null;
};

/** Style configuration for signup forms. */
export type SignupFormStyle = {
  theme: 'light' | 'dark' | 'custom';
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  border_radius: number;
  font_family: string;
  width: string;
  padding: string;
  custom_css: string | null;
};

/** Display rules for popup / flyout / bar forms. */
export type SignupFormDisplayRules = {
  trigger: 'immediate' | 'delay' | 'scroll' | 'exit_intent' | 'click';
  delay_seconds: number | null;
  scroll_percentage: number | null;
  click_selector: string | null;
  show_frequency: 'every_visit' | 'once' | 'once_per_session' | 'custom_days';
  custom_days: number | null;
  hide_on_mobile: boolean;
  page_targeting: 'all' | 'specific' | 'regex';
  page_urls: string[] | null;
  page_regex: string | null;
  start_date: string | null;
  end_date: string | null;
};

/** RSS feed campaign configuration. */
export type RssFeedConfig = {
  feed_url: string;
  check_interval_minutes: number;
  max_items_per_campaign: number;
  filter_keywords: string[] | null;
  template_id: string;
  last_checked_at: string | null;
  last_item_published_at: string | null;
};

/** Send configuration for campaigns (time, throttle, etc.). */
export type CampaignSendConfig = {
  send_at: string | null;
  timezone: string;
  send_in_recipient_timezone: boolean;
  throttle_per_hour: number | null;
  throttle_per_minute: number | null;
  batch_size: number | null;
  batch_delay_seconds: number | null;
  priority: 'low' | 'normal' | 'high';
};

/** Custom field validation rules. */
export type CustomFieldValidation = {
  required: boolean;
  min_length: number | null;
  max_length: number | null;
  min_value: number | null;
  max_value: number | null;
  pattern: string | null;
  pattern_message: string | null;
  options: string[] | null;
  default_value: string | number | boolean | null;
};

/** Template builder metadata. */
export type TemplateBuilderData = {
  blocks: TemplateBlock[];
  global_styles: Record<string, string>;
  version: number;
};

export type TemplateBlock = {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'social' | 'footer' | 'html' | 'video';
  content: Record<string, unknown>;
  styles: Record<string, string>;
  children: TemplateBlock[] | null;
};

/** Metadata attached to email events. */
export type EmailEventMetadata = {
  user_agent?: string;
  ip_address?: string;
  geo_country?: string;
  geo_region?: string;
  geo_city?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  email_client?: string;
  os?: string;
  browser?: string;
  link_url?: string;
  link_id?: string;
  bounce_type?: BounceType;
  bounce_code?: string;
  bounce_message?: string;
  complaint_feedback_type?: string;
  revenue_amount?: number;
  revenue_currency?: string;
  conversion_type?: string;
  [key: string]: unknown;
};

// -----------------------------------------------------------------------------
// Database Type (Supabase-compatible structure)
// -----------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      // -------------------------------------------------------------------
      // organizations
      // -------------------------------------------------------------------
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: OrganizationPlan;
          logo_url: string | null;
          website: string | null;
          default_from_name: string | null;
          default_from_email: string | null;
          default_reply_to: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          phone: string | null;
          timezone: string;
          sending_domain: string | null;
          domain_verified: boolean;
          dkim_verified: boolean;
          spf_verified: boolean;
          dmarc_verified: boolean;
          monthly_email_limit: number;
          monthly_emails_sent: number;
          contact_limit: number;
          max_api_keys: number;
          max_members: number;
          features: Record<string, boolean>;
          billing_email: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          plan_started_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: OrganizationPlan;
          logo_url?: string | null;
          website?: string | null;
          default_from_name?: string | null;
          default_from_email?: string | null;
          default_reply_to?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          timezone?: string;
          sending_domain?: string | null;
          domain_verified?: boolean;
          dkim_verified?: boolean;
          spf_verified?: boolean;
          dmarc_verified?: boolean;
          monthly_email_limit?: number;
          monthly_emails_sent?: number;
          contact_limit?: number;
          max_api_keys?: number;
          max_members?: number;
          features?: Record<string, boolean>;
          billing_email?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          plan_started_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: OrganizationPlan;
          logo_url?: string | null;
          website?: string | null;
          default_from_name?: string | null;
          default_from_email?: string | null;
          default_reply_to?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          timezone?: string;
          sending_domain?: string | null;
          domain_verified?: boolean;
          dkim_verified?: boolean;
          spf_verified?: boolean;
          dmarc_verified?: boolean;
          monthly_email_limit?: number;
          monthly_emails_sent?: number;
          contact_limit?: number;
          max_api_keys?: number;
          max_members?: number;
          features?: Record<string, boolean>;
          billing_email?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          plan_started_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // organization_members
      // -------------------------------------------------------------------
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationMemberRole;
          invited_email: string | null;
          invited_at: string | null;
          accepted_at: string | null;
          last_active_at: string | null;
          permissions: Record<string, boolean> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: OrganizationMemberRole;
          invited_email?: string | null;
          invited_at?: string | null;
          accepted_at?: string | null;
          last_active_at?: string | null;
          permissions?: Record<string, boolean> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrganizationMemberRole;
          invited_email?: string | null;
          invited_at?: string | null;
          accepted_at?: string | null;
          last_active_at?: string | null;
          permissions?: Record<string, boolean> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------------
      // invitations
      // -------------------------------------------------------------------
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: OrganizationMemberRole;
          token: string;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          invited_by: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: OrganizationMemberRole;
          token: string;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          invited_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: OrganizationMemberRole;
          token?: string;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          invited_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------------
      // api_keys
      // -------------------------------------------------------------------
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes: string[];
          rate_limit_per_minute: number;
          rate_limit_per_hour: number;
          allowed_ips: string[] | null;
          allowed_domains: string[] | null;
          last_used_at: string | null;
          last_used_ip: string | null;
          usage_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          rate_limit_per_minute?: number;
          rate_limit_per_hour?: number;
          allowed_ips?: string[] | null;
          allowed_domains?: string[] | null;
          last_used_at?: string | null;
          last_used_ip?: string | null;
          usage_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          scopes?: string[];
          rate_limit_per_minute?: number;
          rate_limit_per_hour?: number;
          allowed_ips?: string[] | null;
          allowed_domains?: string[] | null;
          last_used_at?: string | null;
          last_used_ip?: string | null;
          usage_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // contacts
      // -------------------------------------------------------------------
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          email_hash: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          phone: string | null;
          company: string | null;
          job_title: string | null;
          avatar_url: string | null;
          status: ContactStatus;
          subscribed_at: string | null;
          unsubscribed_at: string | null;
          bounced_at: string | null;
          complained_at: string | null;
          cleaned_at: string | null;
          source: string | null;
          source_detail: string | null;
          ip_address: string | null;
          geo_country: string | null;
          geo_region: string | null;
          geo_city: string | null;
          timezone: string | null;
          language: string | null;
          tags: string[];
          custom_fields: Record<string, unknown>;
          engagement_score: number;
          last_email_sent_at: string | null;
          last_email_opened_at: string | null;
          last_email_clicked_at: string | null;
          last_activity_at: string | null;
          emails_sent: number;
          emails_opened: number;
          emails_clicked: number;
          emails_bounced: number;
          double_opt_in_confirmed: boolean;
          double_opt_in_token: string | null;
          double_opt_in_sent_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          email_hash?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
          status?: ContactStatus;
          subscribed_at?: string | null;
          unsubscribed_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          cleaned_at?: string | null;
          source?: string | null;
          source_detail?: string | null;
          ip_address?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          timezone?: string | null;
          language?: string | null;
          tags?: string[];
          custom_fields?: Record<string, unknown>;
          engagement_score?: number;
          last_email_sent_at?: string | null;
          last_email_opened_at?: string | null;
          last_email_clicked_at?: string | null;
          last_activity_at?: string | null;
          emails_sent?: number;
          emails_opened?: number;
          emails_clicked?: number;
          emails_bounced?: number;
          double_opt_in_confirmed?: boolean;
          double_opt_in_token?: string | null;
          double_opt_in_sent_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          email_hash?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
          status?: ContactStatus;
          subscribed_at?: string | null;
          unsubscribed_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          cleaned_at?: string | null;
          source?: string | null;
          source_detail?: string | null;
          ip_address?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          timezone?: string | null;
          language?: string | null;
          tags?: string[];
          custom_fields?: Record<string, unknown>;
          engagement_score?: number;
          last_email_sent_at?: string | null;
          last_email_opened_at?: string | null;
          last_email_clicked_at?: string | null;
          last_activity_at?: string | null;
          emails_sent?: number;
          emails_opened?: number;
          emails_clicked?: number;
          emails_bounced?: number;
          double_opt_in_confirmed?: boolean;
          double_opt_in_token?: string | null;
          double_opt_in_sent_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // lists
      // -------------------------------------------------------------------
      lists: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          type: ListType;
          dynamic_segment_id: string | null;
          double_opt_in: boolean;
          welcome_email_template_id: string | null;
          default_from_name: string | null;
          default_from_email: string | null;
          tags: string[];
          contact_count: number;
          active_contact_count: number;
          unsubscribed_count: number;
          cleaned_count: number;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          type?: ListType;
          dynamic_segment_id?: string | null;
          double_opt_in?: boolean;
          welcome_email_template_id?: string | null;
          default_from_name?: string | null;
          default_from_email?: string | null;
          tags?: string[];
          contact_count?: number;
          active_contact_count?: number;
          unsubscribed_count?: number;
          cleaned_count?: number;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          type?: ListType;
          dynamic_segment_id?: string | null;
          double_opt_in?: boolean;
          welcome_email_template_id?: string | null;
          default_from_name?: string | null;
          default_from_email?: string | null;
          tags?: string[];
          contact_count?: number;
          active_contact_count?: number;
          unsubscribed_count?: number;
          cleaned_count?: number;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // list_contacts
      // -------------------------------------------------------------------
      list_contacts: {
        Row: {
          id: string;
          list_id: string;
          contact_id: string;
          status: ContactStatus;
          subscribed_at: string;
          unsubscribed_at: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          contact_id: string;
          status?: ContactStatus;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          contact_id?: string;
          status?: ContactStatus;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'list_contacts_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'list_contacts_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------------
      // segments
      // -------------------------------------------------------------------
      segments: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          conditions: SegmentConditionGroup;
          contact_count: number;
          last_calculated_at: string | null;
          is_dynamic: boolean;
          created_by: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          conditions: SegmentConditionGroup;
          contact_count?: number;
          last_calculated_at?: string | null;
          is_dynamic?: boolean;
          created_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          conditions?: SegmentConditionGroup;
          contact_count?: number;
          last_calculated_at?: string | null;
          is_dynamic?: boolean;
          created_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // custom_fields
      // -------------------------------------------------------------------
      custom_fields: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key: string;
          type: CustomFieldType;
          description: string | null;
          is_required: boolean;
          is_visible: boolean;
          is_filterable: boolean;
          sort_order: number;
          validation: CustomFieldValidation | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          key: string;
          type: CustomFieldType;
          description?: string | null;
          is_required?: boolean;
          is_visible?: boolean;
          is_filterable?: boolean;
          sort_order?: number;
          validation?: CustomFieldValidation | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          key?: string;
          type?: CustomFieldType;
          description?: string | null;
          is_required?: boolean;
          is_visible?: boolean;
          is_filterable?: boolean;
          sort_order?: number;
          validation?: CustomFieldValidation | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // email_templates
      // -------------------------------------------------------------------
      email_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          subject: string | null;
          preview_text: string | null;
          from_name: string | null;
          from_email: string | null;
          reply_to: string | null;
          design_mode: DesignMode;
          category: TemplateCategory;
          html_content: string | null;
          text_content: string | null;
          react_component: string | null;
          builder_data: TemplateBuilderData | null;
          thumbnail_url: string | null;
          is_shared: boolean;
          is_archived: boolean;
          tags: string[];
          version: number;
          last_edited_by: string | null;
          usage_count: number;
          last_used_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          subject?: string | null;
          preview_text?: string | null;
          from_name?: string | null;
          from_email?: string | null;
          reply_to?: string | null;
          design_mode?: DesignMode;
          category?: TemplateCategory;
          html_content?: string | null;
          text_content?: string | null;
          react_component?: string | null;
          builder_data?: TemplateBuilderData | null;
          thumbnail_url?: string | null;
          is_shared?: boolean;
          is_archived?: boolean;
          tags?: string[];
          version?: number;
          last_edited_by?: string | null;
          usage_count?: number;
          last_used_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          subject?: string | null;
          preview_text?: string | null;
          from_name?: string | null;
          from_email?: string | null;
          reply_to?: string | null;
          design_mode?: DesignMode;
          category?: TemplateCategory;
          html_content?: string | null;
          text_content?: string | null;
          react_component?: string | null;
          builder_data?: TemplateBuilderData | null;
          thumbnail_url?: string | null;
          is_shared?: boolean;
          is_archived?: boolean;
          tags?: string[];
          version?: number;
          last_edited_by?: string | null;
          usage_count?: number;
          last_used_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // email_template_versions
      // -------------------------------------------------------------------
      email_template_versions: {
        Row: {
          id: string;
          template_id: string;
          version: number;
          name: string;
          subject: string | null;
          preview_text: string | null;
          html_content: string | null;
          text_content: string | null;
          react_component: string | null;
          builder_data: TemplateBuilderData | null;
          design_mode: DesignMode;
          change_description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          version: number;
          name: string;
          subject?: string | null;
          preview_text?: string | null;
          html_content?: string | null;
          text_content?: string | null;
          react_component?: string | null;
          builder_data?: TemplateBuilderData | null;
          design_mode?: DesignMode;
          change_description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          version?: number;
          name?: string;
          subject?: string | null;
          preview_text?: string | null;
          html_content?: string | null;
          text_content?: string | null;
          react_component?: string | null;
          builder_data?: TemplateBuilderData | null;
          design_mode?: DesignMode;
          change_description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // campaigns
      // -------------------------------------------------------------------
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          type: CampaignType;
          status: CampaignStatus;
          subject: string;
          preview_text: string | null;
          from_name: string;
          from_email: string;
          reply_to: string | null;
          template_id: string | null;
          html_content: string | null;
          text_content: string | null;
          list_ids: string[];
          segment_ids: string[];
          excluded_list_ids: string[];
          excluded_segment_ids: string[];
          tags: string[];
          send_config: CampaignSendConfig | null;
          ab_test_config: AbTestConfig | null;
          rss_config: RssFeedConfig | null;
          stats: CampaignStats;
          total_recipients: number;
          estimated_recipients: number | null;
          scheduled_at: string | null;
          sending_started_at: string | null;
          sending_completed_at: string | null;
          cancelled_at: string | null;
          google_analytics_enabled: boolean;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          track_opens: boolean;
          track_clicks: boolean;
          auto_text_content: boolean;
          created_by: string | null;
          last_edited_by: string | null;
          archived_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          type?: CampaignType;
          status?: CampaignStatus;
          subject: string;
          preview_text?: string | null;
          from_name: string;
          from_email: string;
          reply_to?: string | null;
          template_id?: string | null;
          html_content?: string | null;
          text_content?: string | null;
          list_ids?: string[];
          segment_ids?: string[];
          excluded_list_ids?: string[];
          excluded_segment_ids?: string[];
          tags?: string[];
          send_config?: CampaignSendConfig | null;
          ab_test_config?: AbTestConfig | null;
          rss_config?: RssFeedConfig | null;
          stats?: CampaignStats;
          total_recipients?: number;
          estimated_recipients?: number | null;
          scheduled_at?: string | null;
          sending_started_at?: string | null;
          sending_completed_at?: string | null;
          cancelled_at?: string | null;
          google_analytics_enabled?: boolean;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          track_opens?: boolean;
          track_clicks?: boolean;
          auto_text_content?: boolean;
          created_by?: string | null;
          last_edited_by?: string | null;
          archived_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          type?: CampaignType;
          status?: CampaignStatus;
          subject?: string;
          preview_text?: string | null;
          from_name?: string;
          from_email?: string;
          reply_to?: string | null;
          template_id?: string | null;
          html_content?: string | null;
          text_content?: string | null;
          list_ids?: string[];
          segment_ids?: string[];
          excluded_list_ids?: string[];
          excluded_segment_ids?: string[];
          tags?: string[];
          send_config?: CampaignSendConfig | null;
          ab_test_config?: AbTestConfig | null;
          rss_config?: RssFeedConfig | null;
          stats?: CampaignStats;
          total_recipients?: number;
          estimated_recipients?: number | null;
          scheduled_at?: string | null;
          sending_started_at?: string | null;
          sending_completed_at?: string | null;
          cancelled_at?: string | null;
          google_analytics_enabled?: boolean;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          track_opens?: boolean;
          track_clicks?: boolean;
          auto_text_content?: boolean;
          created_by?: string | null;
          last_edited_by?: string | null;
          archived_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campaigns_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'email_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaigns_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------------
      // campaign_emails
      // -------------------------------------------------------------------
      campaign_emails: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string;
          email_address: string;
          status: CampaignEmailStatus;
          variant_id: string | null;
          subject: string;
          from_name: string;
          from_email: string;
          message_id: string | null;
          provider_id: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          first_opened_at: string | null;
          last_opened_at: string | null;
          first_clicked_at: string | null;
          last_clicked_at: string | null;
          bounced_at: string | null;
          complained_at: string | null;
          unsubscribed_at: string | null;
          bounce_type: BounceType | null;
          bounce_code: string | null;
          bounce_message: string | null;
          open_count: number;
          click_count: number;
          user_agent: string | null;
          ip_address: string | null;
          geo_country: string | null;
          geo_region: string | null;
          geo_city: string | null;
          device_type: string | null;
          email_client: string | null;
          retry_count: number;
          last_error: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          contact_id: string;
          email_address: string;
          status?: CampaignEmailStatus;
          variant_id?: string | null;
          subject: string;
          from_name: string;
          from_email: string;
          message_id?: string | null;
          provider_id?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          first_opened_at?: string | null;
          last_opened_at?: string | null;
          first_clicked_at?: string | null;
          last_clicked_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          unsubscribed_at?: string | null;
          bounce_type?: BounceType | null;
          bounce_code?: string | null;
          bounce_message?: string | null;
          open_count?: number;
          click_count?: number;
          user_agent?: string | null;
          ip_address?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          device_type?: string | null;
          email_client?: string | null;
          retry_count?: number;
          last_error?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          contact_id?: string;
          email_address?: string;
          status?: CampaignEmailStatus;
          variant_id?: string | null;
          subject?: string;
          from_name?: string;
          from_email?: string;
          message_id?: string | null;
          provider_id?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          first_opened_at?: string | null;
          last_opened_at?: string | null;
          first_clicked_at?: string | null;
          last_clicked_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          unsubscribed_at?: string | null;
          bounce_type?: BounceType | null;
          bounce_code?: string | null;
          bounce_message?: string | null;
          open_count?: number;
          click_count?: number;
          user_agent?: string | null;
          ip_address?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          device_type?: string | null;
          email_client?: string | null;
          retry_count?: number;
          last_error?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campaign_emails_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaign_emails_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------------
      // email_events
      // -------------------------------------------------------------------
      email_events: {
        Row: {
          id: string;
          organization_id: string;
          campaign_id: string | null;
          campaign_email_id: string | null;
          contact_id: string | null;
          email_address: string;
          event_type: EmailEventType;
          message_id: string | null;
          provider_id: string | null;
          timestamp: string;
          metadata: EmailEventMetadata | null;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          campaign_id?: string | null;
          campaign_email_id?: string | null;
          contact_id?: string | null;
          email_address: string;
          event_type: EmailEventType;
          message_id?: string | null;
          provider_id?: string | null;
          timestamp?: string;
          metadata?: EmailEventMetadata | null;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          campaign_id?: string | null;
          campaign_email_id?: string | null;
          contact_id?: string | null;
          email_address?: string;
          event_type?: EmailEventType;
          message_id?: string | null;
          provider_id?: string | null;
          timestamp?: string;
          metadata?: EmailEventMetadata | null;
          processed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // tracked_links
      // -------------------------------------------------------------------
      tracked_links: {
        Row: {
          id: string;
          campaign_id: string;
          original_url: string;
          tracking_url: string;
          tracking_code: string;
          link_index: number;
          total_clicks: number;
          unique_clicks: number;
          last_clicked_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          original_url: string;
          tracking_url: string;
          tracking_code: string;
          link_index?: number;
          total_clicks?: number;
          unique_clicks?: number;
          last_clicked_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          original_url?: string;
          tracking_url?: string;
          tracking_code?: string;
          link_index?: number;
          total_clicks?: number;
          unique_clicks?: number;
          last_clicked_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // link_clicks
      // -------------------------------------------------------------------
      link_clicks: {
        Row: {
          id: string;
          tracked_link_id: string;
          campaign_email_id: string | null;
          contact_id: string | null;
          user_agent: string | null;
          ip_address: string | null;
          geo_country: string | null;
          geo_region: string | null;
          geo_city: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          referer: string | null;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          tracked_link_id: string;
          campaign_email_id?: string | null;
          contact_id?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          referer?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          tracked_link_id?: string;
          campaign_email_id?: string | null;
          contact_id?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          referer?: string | null;
          clicked_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // suppression_list
      // -------------------------------------------------------------------
      suppression_list: {
        Row: {
          id: string;
          organization_id: string;
          email_address: string;
          email_hash: string;
          reason: SuppressionReason;
          source: string | null;
          source_detail: string | null;
          campaign_id: string | null;
          bounce_type: BounceType | null;
          bounce_code: string | null;
          complaint_feedback_type: string | null;
          expires_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email_address: string;
          email_hash?: string;
          reason: SuppressionReason;
          source?: string | null;
          source_detail?: string | null;
          campaign_id?: string | null;
          bounce_type?: BounceType | null;
          bounce_code?: string | null;
          complaint_feedback_type?: string | null;
          expires_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email_address?: string;
          email_hash?: string;
          reason?: SuppressionReason;
          source?: string | null;
          source_detail?: string | null;
          campaign_id?: string | null;
          bounce_type?: BounceType | null;
          bounce_code?: string | null;
          complaint_feedback_type?: string | null;
          expires_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // signup_forms
      // -------------------------------------------------------------------
      signup_forms: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          type: SignupFormType;
          status: 'active' | 'inactive' | 'archived';
          list_ids: string[];
          tag_ids: string[];
          config: SignupFormConfig;
          style: SignupFormStyle | null;
          display_rules: SignupFormDisplayRules | null;
          custom_html: string | null;
          custom_css: string | null;
          custom_js: string | null;
          success_redirect_url: string | null;
          embed_code: string | null;
          hosted_url: string | null;
          total_views: number;
          total_submissions: number;
          total_conversions: number;
          conversion_rate: number;
          last_submission_at: string | null;
          created_by: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          type: SignupFormType;
          status?: 'active' | 'inactive' | 'archived';
          list_ids?: string[];
          tag_ids?: string[];
          config: SignupFormConfig;
          style?: SignupFormStyle | null;
          display_rules?: SignupFormDisplayRules | null;
          custom_html?: string | null;
          custom_css?: string | null;
          custom_js?: string | null;
          success_redirect_url?: string | null;
          embed_code?: string | null;
          hosted_url?: string | null;
          total_views?: number;
          total_submissions?: number;
          total_conversions?: number;
          conversion_rate?: number;
          last_submission_at?: string | null;
          created_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          type?: SignupFormType;
          status?: 'active' | 'inactive' | 'archived';
          list_ids?: string[];
          tag_ids?: string[];
          config?: SignupFormConfig;
          style?: SignupFormStyle | null;
          display_rules?: SignupFormDisplayRules | null;
          custom_html?: string | null;
          custom_css?: string | null;
          custom_js?: string | null;
          success_redirect_url?: string | null;
          embed_code?: string | null;
          hosted_url?: string | null;
          total_views?: number;
          total_submissions?: number;
          total_conversions?: number;
          conversion_rate?: number;
          last_submission_at?: string | null;
          created_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // automations
      // -------------------------------------------------------------------
      automations: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          status: AutomationStatus;
          trigger_type: AutomationTriggerType;
          trigger_config: AutomationTriggerConfig;
          steps: AutomationStep[];
          entry_conditions: SegmentConditionGroup | null;
          exit_conditions: SegmentConditionGroup | null;
          goal_conditions: SegmentConditionGroup | null;
          allow_re_entry: boolean;
          re_entry_delay_hours: number | null;
          max_enrollments_per_contact: number | null;
          total_enrolled: number;
          total_completed: number;
          total_exited: number;
          total_active: number;
          conversion_count: number;
          conversion_rate: number;
          activated_at: string | null;
          paused_at: string | null;
          archived_at: string | null;
          created_by: string | null;
          last_edited_by: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          status?: AutomationStatus;
          trigger_type: AutomationTriggerType;
          trigger_config: AutomationTriggerConfig;
          steps?: AutomationStep[];
          entry_conditions?: SegmentConditionGroup | null;
          exit_conditions?: SegmentConditionGroup | null;
          goal_conditions?: SegmentConditionGroup | null;
          allow_re_entry?: boolean;
          re_entry_delay_hours?: number | null;
          max_enrollments_per_contact?: number | null;
          total_enrolled?: number;
          total_completed?: number;
          total_exited?: number;
          total_active?: number;
          conversion_count?: number;
          conversion_rate?: number;
          activated_at?: string | null;
          paused_at?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          last_edited_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          status?: AutomationStatus;
          trigger_type?: AutomationTriggerType;
          trigger_config?: AutomationTriggerConfig;
          steps?: AutomationStep[];
          entry_conditions?: SegmentConditionGroup | null;
          exit_conditions?: SegmentConditionGroup | null;
          goal_conditions?: SegmentConditionGroup | null;
          allow_re_entry?: boolean;
          re_entry_delay_hours?: number | null;
          max_enrollments_per_contact?: number | null;
          total_enrolled?: number;
          total_completed?: number;
          total_exited?: number;
          total_active?: number;
          conversion_count?: number;
          conversion_rate?: number;
          activated_at?: string | null;
          paused_at?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          last_edited_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // automation_enrollments
      // -------------------------------------------------------------------
      automation_enrollments: {
        Row: {
          id: string;
          automation_id: string;
          contact_id: string;
          status: AutomationEnrollmentStatus;
          current_step_id: string | null;
          current_step_index: number;
          enrolled_at: string;
          started_at: string | null;
          completed_at: string | null;
          exited_at: string | null;
          paused_at: string | null;
          failed_at: string | null;
          exit_reason: string | null;
          failure_reason: string | null;
          next_action_at: string | null;
          steps_completed: number;
          emails_sent: number;
          emails_opened: number;
          emails_clicked: number;
          converted: boolean;
          converted_at: string | null;
          step_history: AutomationEnrollmentStepRecord[];
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          automation_id: string;
          contact_id: string;
          status?: AutomationEnrollmentStatus;
          current_step_id?: string | null;
          current_step_index?: number;
          enrolled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          exited_at?: string | null;
          paused_at?: string | null;
          failed_at?: string | null;
          exit_reason?: string | null;
          failure_reason?: string | null;
          next_action_at?: string | null;
          steps_completed?: number;
          emails_sent?: number;
          emails_opened?: number;
          emails_clicked?: number;
          converted?: boolean;
          converted_at?: string | null;
          step_history?: AutomationEnrollmentStepRecord[];
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          automation_id?: string;
          contact_id?: string;
          status?: AutomationEnrollmentStatus;
          current_step_id?: string | null;
          current_step_index?: number;
          enrolled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          exited_at?: string | null;
          paused_at?: string | null;
          failed_at?: string | null;
          exit_reason?: string | null;
          failure_reason?: string | null;
          next_action_at?: string | null;
          steps_completed?: number;
          emails_sent?: number;
          emails_opened?: number;
          emails_clicked?: number;
          converted?: boolean;
          converted_at?: string | null;
          step_history?: AutomationEnrollmentStepRecord[];
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // audit_logs
      // -------------------------------------------------------------------
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          api_key_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          description: string | null;
          changes: AuditLogChanges | null;
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          session_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          api_key_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          description?: string | null;
          changes?: AuditLogChanges | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          session_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          api_key_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          description?: string | null;
          changes?: AuditLogChanges | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          session_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -------------------------------------------------------------------
      // webhooks
      // -------------------------------------------------------------------
      webhooks: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          url: string;
          secret: string;
          events: WebhookEventType[];
          is_active: boolean;
          headers: Record<string, string> | null;
          timeout_ms: number;
          max_retries: number;
          retry_delay_seconds: number;
          last_triggered_at: string | null;
          last_success_at: string | null;
          last_failure_at: string | null;
          last_status_code: number | null;
          last_error: string | null;
          total_triggers: number;
          total_successes: number;
          total_failures: number;
          consecutive_failures: number;
          disabled_at: string | null;
          disabled_reason: string | null;
          created_by: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          url: string;
          secret: string;
          events: WebhookEventType[];
          is_active?: boolean;
          headers?: Record<string, string> | null;
          timeout_ms?: number;
          max_retries?: number;
          retry_delay_seconds?: number;
          last_triggered_at?: string | null;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          last_status_code?: number | null;
          last_error?: string | null;
          total_triggers?: number;
          total_successes?: number;
          total_failures?: number;
          consecutive_failures?: number;
          disabled_at?: string | null;
          disabled_reason?: string | null;
          created_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          url?: string;
          secret?: string;
          events?: WebhookEventType[];
          is_active?: boolean;
          headers?: Record<string, string> | null;
          timeout_ms?: number;
          max_retries?: number;
          retry_delay_seconds?: number;
          last_triggered_at?: string | null;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          last_status_code?: number | null;
          last_error?: string | null;
          total_triggers?: number;
          total_successes?: number;
          total_failures?: number;
          consecutive_failures?: number;
          disabled_at?: string | null;
          disabled_reason?: string | null;
          created_by?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      organization_plan: OrganizationPlan;
      organization_member_role: OrganizationMemberRole;
      contact_status: ContactStatus;
      list_type: ListType;
      custom_field_type: CustomFieldType;
      design_mode: DesignMode;
      template_category: TemplateCategory;
      campaign_type: CampaignType;
      campaign_status: CampaignStatus;
      campaign_email_status: CampaignEmailStatus;
      email_event_type: EmailEventType;
      suppression_reason: SuppressionReason;
      signup_form_type: SignupFormType;
      automation_status: AutomationStatus;
      automation_trigger_type: AutomationTriggerType;
      automation_enrollment_status: AutomationEnrollmentStatus;
      bounce_type: BounceType;
      webhook_event_type: WebhookEventType;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// -----------------------------------------------------------------------------
// Additional JSON types referenced by rows
// -----------------------------------------------------------------------------

export type AutomationEnrollmentStepRecord = {
  step_id: string;
  step_type: string;
  started_at: string;
  completed_at: string | null;
  status: 'completed' | 'skipped' | 'failed';
  result: Record<string, unknown> | null;
};

export type AuditLogChanges = {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  diff: Record<string, { old: unknown; new: unknown }> | null;
};

// -----------------------------------------------------------------------------
// Convenience Row Type Aliases
// -----------------------------------------------------------------------------

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert'];
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update'];

export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert'];
export type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update'];

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export type List = Database['public']['Tables']['lists']['Row'];
export type ListInsert = Database['public']['Tables']['lists']['Insert'];
export type ListUpdate = Database['public']['Tables']['lists']['Update'];

export type ListContact = Database['public']['Tables']['list_contacts']['Row'];
export type ListContactInsert = Database['public']['Tables']['list_contacts']['Insert'];
export type ListContactUpdate = Database['public']['Tables']['list_contacts']['Update'];

export type Segment = Database['public']['Tables']['segments']['Row'];
export type SegmentInsert = Database['public']['Tables']['segments']['Insert'];
export type SegmentUpdate = Database['public']['Tables']['segments']['Update'];

export type CustomField = Database['public']['Tables']['custom_fields']['Row'];
export type CustomFieldInsert = Database['public']['Tables']['custom_fields']['Insert'];
export type CustomFieldUpdate = Database['public']['Tables']['custom_fields']['Update'];

export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type EmailTemplateInsert = Database['public']['Tables']['email_templates']['Insert'];
export type EmailTemplateUpdate = Database['public']['Tables']['email_templates']['Update'];

export type EmailTemplateVersion = Database['public']['Tables']['email_template_versions']['Row'];
export type EmailTemplateVersionInsert = Database['public']['Tables']['email_template_versions']['Insert'];
export type EmailTemplateVersionUpdate = Database['public']['Tables']['email_template_versions']['Update'];

export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export type CampaignEmail = Database['public']['Tables']['campaign_emails']['Row'];
export type CampaignEmailInsert = Database['public']['Tables']['campaign_emails']['Insert'];
export type CampaignEmailUpdate = Database['public']['Tables']['campaign_emails']['Update'];

export type EmailEvent = Database['public']['Tables']['email_events']['Row'];
export type EmailEventInsert = Database['public']['Tables']['email_events']['Insert'];
export type EmailEventUpdate = Database['public']['Tables']['email_events']['Update'];

export type TrackedLink = Database['public']['Tables']['tracked_links']['Row'];
export type TrackedLinkInsert = Database['public']['Tables']['tracked_links']['Insert'];
export type TrackedLinkUpdate = Database['public']['Tables']['tracked_links']['Update'];

export type LinkClick = Database['public']['Tables']['link_clicks']['Row'];
export type LinkClickInsert = Database['public']['Tables']['link_clicks']['Insert'];
export type LinkClickUpdate = Database['public']['Tables']['link_clicks']['Update'];

export type SuppressionEntry = Database['public']['Tables']['suppression_list']['Row'];
export type SuppressionEntryInsert = Database['public']['Tables']['suppression_list']['Insert'];
export type SuppressionEntryUpdate = Database['public']['Tables']['suppression_list']['Update'];

export type SignupForm = Database['public']['Tables']['signup_forms']['Row'];
export type SignupFormInsert = Database['public']['Tables']['signup_forms']['Insert'];
export type SignupFormUpdate = Database['public']['Tables']['signup_forms']['Update'];

export type Automation = Database['public']['Tables']['automations']['Row'];
export type AutomationInsert = Database['public']['Tables']['automations']['Insert'];
export type AutomationUpdate = Database['public']['Tables']['automations']['Update'];

export type AutomationEnrollment = Database['public']['Tables']['automation_enrollments']['Row'];
export type AutomationEnrollmentInsert = Database['public']['Tables']['automation_enrollments']['Insert'];
export type AutomationEnrollmentUpdate = Database['public']['Tables']['automation_enrollments']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update'];

export type Webhook = Database['public']['Tables']['webhooks']['Row'];
export type WebhookInsert = Database['public']['Tables']['webhooks']['Insert'];
export type WebhookUpdate = Database['public']['Tables']['webhooks']['Update'];

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

/** Extract table names as a union type. */
export type TableName = keyof Database['public']['Tables'];

/** Generic Row type for any table. */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/** Generic Insert type for any table. */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/** Generic Update type for any table. */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/** Extract enum names as a union type. */
export type EnumName = keyof Database['public']['Enums'];

/** Generic enum value type. */
export type EnumValue<T extends EnumName> = Database['public']['Enums'][T];
