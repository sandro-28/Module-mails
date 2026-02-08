-- =============================================================================
-- MailForge Initial Schema Migration
-- Generated from /src/types/database.ts
-- =============================================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

CREATE TYPE organization_plan AS ENUM (
  'free', 'starter', 'pro', 'enterprise'
);

CREATE TYPE organization_member_role AS ENUM (
  'owner', 'admin', 'editor', 'viewer', 'api_only'
);

CREATE TYPE contact_status AS ENUM (
  'active', 'unsubscribed', 'bounced', 'complained', 'cleaned', 'pending'
);

CREATE TYPE list_type AS ENUM (
  'static', 'dynamic'
);

CREATE TYPE custom_field_type AS ENUM (
  'text', 'number', 'date', 'boolean', 'select', 'multi_select', 'url', 'phone'
);

CREATE TYPE design_mode AS ENUM (
  'builder', 'code', 'react'
);

CREATE TYPE template_category AS ENUM (
  'custom', 'newsletter', 'promotion', 'transactional', 'welcome',
  'notification', 'event', 'survey'
);

CREATE TYPE campaign_type AS ENUM (
  'regular', 'ab_test', 'automated', 'transactional', 'rss'
);

CREATE TYPE campaign_status AS ENUM (
  'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'
);

CREATE TYPE campaign_email_status AS ENUM (
  'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked',
  'bounced', 'complained', 'failed'
);

CREATE TYPE email_event_type AS ENUM (
  'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained',
  'unsubscribed', 'forwarded', 'converted', 'revenue'
);

CREATE TYPE suppression_reason AS ENUM (
  'unsubscribed', 'hard_bounce', 'complaint', 'manual', 'list_unsubscribe'
);

CREATE TYPE signup_form_type AS ENUM (
  'embedded', 'popup', 'landing', 'flyout', 'bar'
);

CREATE TYPE automation_status AS ENUM (
  'draft', 'active', 'paused', 'archived'
);

CREATE TYPE automation_trigger_type AS ENUM (
  'contact_created', 'contact_added_to_list', 'contact_tag_added',
  'form_submitted', 'email_opened', 'email_clicked', 'date_field',
  'engagement_score_change', 'webhook', 'manual'
);

CREATE TYPE automation_enrollment_status AS ENUM (
  'active', 'completed', 'exited', 'paused', 'failed'
);

CREATE TYPE bounce_type AS ENUM (
  'hard', 'soft'
);

CREATE TYPE webhook_event_type AS ENUM (
  'contact.created', 'contact.updated', 'contact.deleted',
  'contact.subscribed', 'contact.unsubscribed',
  'email.sent', 'email.delivered', 'email.opened',
  'email.clicked', 'email.bounced', 'email.complained',
  'campaign.sent', 'campaign.completed',
  'form.submitted',
  'automation.enrolled', 'automation.completed'
);

-- Additional inline enums not in Database.Enums but used by tables
CREATE TYPE invitation_status AS ENUM (
  'pending', 'accepted', 'declined', 'expired'
);

CREATE TYPE signup_form_status AS ENUM (
  'active', 'inactive', 'archived'
);

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

-- Returns organization IDs the current auth user belongs to
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid();
$$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- email_hash trigger function: MD5 of lowercased email
CREATE OR REPLACE FUNCTION set_email_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email_hash = md5(lower(NEW.email));
  RETURN NEW;
END;
$$;

-- email_hash trigger for suppression_list (uses email_address column)
CREATE OR REPLACE FUNCTION set_suppression_email_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email_hash = md5(lower(NEW.email_address));
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. TABLES
-- ============================================================

-- -------------------------------------------------------------------
-- organizations
-- -------------------------------------------------------------------
CREATE TABLE organizations (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name                    text NOT NULL,
  slug                    text NOT NULL,
  plan                    organization_plan NOT NULL DEFAULT 'free',
  logo_url                text,
  website                 text,
  default_from_name       text,
  default_from_email      text,
  default_reply_to        text,
  address_line1           text,
  address_line2           text,
  city                    text,
  state                   text,
  postal_code             text,
  country                 text,
  phone                   text,
  timezone                text NOT NULL DEFAULT 'UTC',
  sending_domain          text,
  domain_verified         boolean NOT NULL DEFAULT false,
  dkim_verified           boolean NOT NULL DEFAULT false,
  spf_verified            boolean NOT NULL DEFAULT false,
  dmarc_verified          boolean NOT NULL DEFAULT false,
  monthly_email_limit     integer NOT NULL DEFAULT 1000,
  monthly_emails_sent     integer NOT NULL DEFAULT 0,
  contact_limit           integer NOT NULL DEFAULT 500,
  max_api_keys            integer NOT NULL DEFAULT 5,
  max_members             integer NOT NULL DEFAULT 5,
  features                jsonb NOT NULL DEFAULT '{}'::jsonb,
  billing_email           text,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  trial_ends_at           timestamptz,
  plan_started_at         timestamptz,
  metadata                jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organizations_slug_unique UNIQUE (slug)
);

-- -------------------------------------------------------------------
-- organization_members
-- -------------------------------------------------------------------
CREATE TABLE organization_members (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid NOT NULL,
  user_id           uuid NOT NULL,
  role              organization_member_role NOT NULL,
  invited_email     text,
  invited_at        timestamptz,
  accepted_at       timestamptz,
  last_active_at    timestamptz,
  permissions       jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organization_members_org_user_unique UNIQUE (organization_id, user_id),

  CONSTRAINT organization_members_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT organization_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- invitations
-- -------------------------------------------------------------------
CREATE TABLE invitations (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid NOT NULL,
  email             text NOT NULL,
  role              organization_member_role NOT NULL,
  token             text NOT NULL,
  status            invitation_status NOT NULL DEFAULT 'pending',
  invited_by        text,
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT invitations_token_unique UNIQUE (token),

  CONSTRAINT invitations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- api_keys
-- -------------------------------------------------------------------
CREATE TABLE api_keys (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id         uuid NOT NULL,
  user_id                 uuid NOT NULL,
  name                    text NOT NULL,
  key_hash                text NOT NULL,
  key_prefix              text NOT NULL,
  scopes                  text[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute   integer NOT NULL DEFAULT 60,
  rate_limit_per_hour     integer NOT NULL DEFAULT 1000,
  allowed_ips             text[],
  allowed_domains         text[],
  last_used_at            timestamptz,
  last_used_ip            text,
  usage_count             integer NOT NULL DEFAULT 0,
  expires_at              timestamptz,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT api_keys_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- contacts
-- -------------------------------------------------------------------
CREATE TABLE contacts (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id           uuid NOT NULL,
  email                     text NOT NULL,
  email_hash                text NOT NULL DEFAULT '',
  first_name                text,
  last_name                 text,
  full_name                 text,
  phone                     text,
  company                   text,
  job_title                 text,
  avatar_url                text,
  status                    contact_status NOT NULL DEFAULT 'active',
  subscribed_at             timestamptz,
  unsubscribed_at           timestamptz,
  bounced_at                timestamptz,
  complained_at             timestamptz,
  cleaned_at                timestamptz,
  source                    text,
  source_detail             text,
  ip_address                text,
  geo_country               text,
  geo_region                text,
  geo_city                  text,
  timezone                  text,
  language                  text,
  tags                      text[] NOT NULL DEFAULT '{}',
  custom_fields             jsonb NOT NULL DEFAULT '{}'::jsonb,
  engagement_score          numeric NOT NULL DEFAULT 0,
  last_email_sent_at        timestamptz,
  last_email_opened_at      timestamptz,
  last_email_clicked_at     timestamptz,
  last_activity_at          timestamptz,
  emails_sent               integer NOT NULL DEFAULT 0,
  emails_opened             integer NOT NULL DEFAULT 0,
  emails_clicked            integer NOT NULL DEFAULT 0,
  emails_bounced            integer NOT NULL DEFAULT 0,
  double_opt_in_confirmed   boolean NOT NULL DEFAULT false,
  double_opt_in_token       text,
  double_opt_in_sent_at     timestamptz,
  metadata                  jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contacts_org_email_unique UNIQUE (organization_id, email),

  CONSTRAINT contacts_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- lists
-- -------------------------------------------------------------------
CREATE TABLE lists (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id             uuid NOT NULL,
  name                        text NOT NULL,
  description                 text,
  type                        list_type NOT NULL DEFAULT 'static',
  dynamic_segment_id          uuid,
  double_opt_in               boolean NOT NULL DEFAULT false,
  welcome_email_template_id   uuid,
  default_from_name           text,
  default_from_email          text,
  tags                        text[] NOT NULL DEFAULT '{}',
  contact_count               integer NOT NULL DEFAULT 0,
  active_contact_count        integer NOT NULL DEFAULT 0,
  unsubscribed_count          integer NOT NULL DEFAULT 0,
  cleaned_count               integer NOT NULL DEFAULT 0,
  metadata                    jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lists_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- list_contacts
-- -------------------------------------------------------------------
CREATE TABLE list_contacts (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id           uuid NOT NULL,
  contact_id        uuid NOT NULL,
  status            contact_status NOT NULL DEFAULT 'active',
  subscribed_at     timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at   timestamptz,
  source            text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT list_contacts_list_contact_unique UNIQUE (list_id, contact_id),

  CONSTRAINT list_contacts_list_id_fkey
    FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE,
  CONSTRAINT list_contacts_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- segments
-- -------------------------------------------------------------------
CREATE TABLE segments (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id       uuid NOT NULL,
  name                  text NOT NULL,
  description           text,
  conditions            jsonb NOT NULL,
  contact_count         integer NOT NULL DEFAULT 0,
  last_calculated_at    timestamptz,
  is_dynamic            boolean NOT NULL DEFAULT true,
  created_by            uuid,
  metadata              jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT segments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- custom_fields
-- -------------------------------------------------------------------
CREATE TABLE custom_fields (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid NOT NULL,
  name              text NOT NULL,
  key               text NOT NULL,
  type              custom_field_type NOT NULL,
  description       text,
  is_required       boolean NOT NULL DEFAULT false,
  is_visible        boolean NOT NULL DEFAULT true,
  is_filterable     boolean NOT NULL DEFAULT false,
  sort_order        integer NOT NULL DEFAULT 0,
  validation        jsonb,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT custom_fields_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- email_templates
-- -------------------------------------------------------------------
CREATE TABLE email_templates (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid NOT NULL,
  name              text NOT NULL,
  description       text,
  subject           text,
  preview_text      text,
  from_name         text,
  from_email        text,
  reply_to          text,
  design_mode       design_mode NOT NULL DEFAULT 'builder',
  category          template_category NOT NULL DEFAULT 'custom',
  html_content      text,
  text_content      text,
  react_component   text,
  builder_data      jsonb,
  thumbnail_url     text,
  is_shared         boolean NOT NULL DEFAULT false,
  is_archived       boolean NOT NULL DEFAULT false,
  tags              text[] NOT NULL DEFAULT '{}',
  version           integer NOT NULL DEFAULT 1,
  last_edited_by    uuid,
  usage_count       integer NOT NULL DEFAULT 0,
  last_used_at      timestamptz,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT email_templates_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- email_template_versions
-- -------------------------------------------------------------------
CREATE TABLE email_template_versions (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id         uuid NOT NULL,
  version             integer NOT NULL,
  name                text NOT NULL,
  subject             text,
  preview_text        text,
  html_content        text,
  text_content        text,
  react_component     text,
  builder_data        jsonb,
  design_mode         design_mode NOT NULL DEFAULT 'builder',
  change_description  text,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT email_template_versions_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES email_templates (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- campaigns
-- -------------------------------------------------------------------
CREATE TABLE campaigns (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id           uuid NOT NULL,
  name                      text NOT NULL,
  description               text,
  type                      campaign_type NOT NULL DEFAULT 'regular',
  status                    campaign_status NOT NULL DEFAULT 'draft',
  subject                   text NOT NULL,
  preview_text              text,
  from_name                 text NOT NULL,
  from_email                text NOT NULL,
  reply_to                  text,
  template_id               uuid,
  html_content              text,
  text_content              text,
  list_ids                  text[] NOT NULL DEFAULT '{}',
  segment_ids               text[] NOT NULL DEFAULT '{}',
  excluded_list_ids         text[] NOT NULL DEFAULT '{}',
  excluded_segment_ids      text[] NOT NULL DEFAULT '{}',
  tags                      text[] NOT NULL DEFAULT '{}',
  send_config               jsonb,
  ab_test_config            jsonb,
  rss_config                jsonb,
  stats                     jsonb NOT NULL DEFAULT '{"total":0,"sent":0,"delivered":0,"opened":0,"unique_opens":0,"clicked":0,"unique_clicks":0,"bounced":0,"hard_bounced":0,"soft_bounced":0,"complained":0,"unsubscribed":0,"forwarded":0,"converted":0,"revenue":0,"open_rate":0,"click_rate":0,"bounce_rate":0,"complaint_rate":0,"unsubscribe_rate":0}'::jsonb,
  total_recipients          integer NOT NULL DEFAULT 0,
  estimated_recipients      integer,
  scheduled_at              timestamptz,
  sending_started_at        timestamptz,
  sending_completed_at      timestamptz,
  cancelled_at              timestamptz,
  google_analytics_enabled  boolean NOT NULL DEFAULT false,
  utm_source                text,
  utm_medium                text,
  utm_campaign              text,
  utm_content               text,
  utm_term                  text,
  track_opens               boolean NOT NULL DEFAULT true,
  track_clicks              boolean NOT NULL DEFAULT true,
  auto_text_content         boolean NOT NULL DEFAULT true,
  created_by                uuid,
  last_edited_by            uuid,
  archived_at               timestamptz,
  metadata                  jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT campaigns_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT campaigns_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES email_templates (id) ON DELETE SET NULL
);

-- -------------------------------------------------------------------
-- campaign_emails
-- -------------------------------------------------------------------
CREATE TABLE campaign_emails (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id       uuid NOT NULL,
  contact_id        uuid,
  email_address     text NOT NULL,
  status            campaign_email_status NOT NULL DEFAULT 'queued',
  variant_id        text,
  subject           text NOT NULL,
  from_name         text NOT NULL,
  from_email        text NOT NULL,
  message_id        text,
  provider_id       text,
  sent_at           timestamptz,
  delivered_at      timestamptz,
  first_opened_at   timestamptz,
  last_opened_at    timestamptz,
  first_clicked_at  timestamptz,
  last_clicked_at   timestamptz,
  bounced_at        timestamptz,
  complained_at     timestamptz,
  unsubscribed_at   timestamptz,
  bounce_type       bounce_type,
  bounce_code       text,
  bounce_message    text,
  open_count        integer NOT NULL DEFAULT 0,
  click_count       integer NOT NULL DEFAULT 0,
  user_agent        text,
  ip_address        text,
  geo_country       text,
  geo_region        text,
  geo_city          text,
  device_type       text,
  email_client      text,
  retry_count       integer NOT NULL DEFAULT 0,
  last_error        text,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT campaign_emails_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  CONSTRAINT campaign_emails_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL
);

-- -------------------------------------------------------------------
-- email_events
-- -------------------------------------------------------------------
CREATE TABLE email_events (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id     uuid NOT NULL,
  campaign_id         uuid,
  campaign_email_id   uuid,
  contact_id          uuid,
  email_address       text NOT NULL,
  event_type          email_event_type NOT NULL,
  message_id          text,
  provider_id         text,
  timestamp           timestamptz NOT NULL DEFAULT now(),
  metadata            jsonb,
  processed           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT email_events_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- tracked_links
-- -------------------------------------------------------------------
CREATE TABLE tracked_links (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id     uuid NOT NULL,
  original_url    text NOT NULL,
  tracking_url    text NOT NULL,
  tracking_code   text NOT NULL,
  link_index      integer NOT NULL DEFAULT 0,
  total_clicks    integer NOT NULL DEFAULT 0,
  unique_clicks   integer NOT NULL DEFAULT 0,
  last_clicked_at timestamptz,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tracked_links_tracking_code_unique UNIQUE (tracking_code),

  CONSTRAINT tracked_links_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- link_clicks
-- -------------------------------------------------------------------
CREATE TABLE link_clicks (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tracked_link_id   uuid NOT NULL,
  campaign_email_id uuid,
  contact_id        uuid,
  user_agent        text,
  ip_address        text,
  geo_country       text,
  geo_region        text,
  geo_city          text,
  device_type       text,
  browser           text,
  os                text,
  referer           text,
  clicked_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT link_clicks_tracked_link_id_fkey
    FOREIGN KEY (tracked_link_id) REFERENCES tracked_links (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- suppression_list
-- -------------------------------------------------------------------
CREATE TABLE suppression_list (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id           uuid NOT NULL,
  email_address             text NOT NULL,
  email_hash                text NOT NULL DEFAULT '',
  reason                    suppression_reason NOT NULL,
  source                    text,
  source_detail             text,
  campaign_id               uuid,
  bounce_type               bounce_type,
  bounce_code               text,
  complaint_feedback_type   text,
  expires_at                timestamptz,
  notes                     text,
  created_by                uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT suppression_list_org_email_unique UNIQUE (organization_id, email_address),

  CONSTRAINT suppression_list_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- signup_forms
-- -------------------------------------------------------------------
CREATE TABLE signup_forms (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id       uuid NOT NULL,
  name                  text NOT NULL,
  description           text,
  type                  signup_form_type NOT NULL,
  status                signup_form_status NOT NULL DEFAULT 'active',
  list_ids              text[] NOT NULL DEFAULT '{}',
  tag_ids               text[] NOT NULL DEFAULT '{}',
  config                jsonb NOT NULL,
  style                 jsonb,
  display_rules         jsonb,
  custom_html           text,
  custom_css            text,
  custom_js             text,
  success_redirect_url  text,
  embed_code            text,
  hosted_url            text,
  total_views           integer NOT NULL DEFAULT 0,
  total_submissions     integer NOT NULL DEFAULT 0,
  total_conversions     integer NOT NULL DEFAULT 0,
  conversion_rate       numeric NOT NULL DEFAULT 0,
  last_submission_at    timestamptz,
  created_by            uuid,
  metadata              jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT signup_forms_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- automations
-- -------------------------------------------------------------------
CREATE TABLE automations (
  id                            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id               uuid NOT NULL,
  name                          text NOT NULL,
  description                   text,
  status                        automation_status NOT NULL DEFAULT 'draft',
  trigger_type                  automation_trigger_type NOT NULL,
  trigger_config                jsonb NOT NULL,
  steps                         jsonb NOT NULL DEFAULT '[]'::jsonb,
  entry_conditions              jsonb,
  exit_conditions               jsonb,
  goal_conditions               jsonb,
  allow_re_entry                boolean NOT NULL DEFAULT false,
  re_entry_delay_hours          integer,
  max_enrollments_per_contact   integer,
  total_enrolled                integer NOT NULL DEFAULT 0,
  total_completed               integer NOT NULL DEFAULT 0,
  total_exited                  integer NOT NULL DEFAULT 0,
  total_active                  integer NOT NULL DEFAULT 0,
  conversion_count              integer NOT NULL DEFAULT 0,
  conversion_rate               numeric NOT NULL DEFAULT 0,
  activated_at                  timestamptz,
  paused_at                     timestamptz,
  archived_at                   timestamptz,
  created_by                    uuid,
  last_edited_by                uuid,
  metadata                      jsonb,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT automations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- automation_enrollments
-- -------------------------------------------------------------------
CREATE TABLE automation_enrollments (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id       uuid NOT NULL,
  contact_id          uuid NOT NULL,
  status              automation_enrollment_status NOT NULL DEFAULT 'active',
  current_step_id     text,
  current_step_index  integer NOT NULL DEFAULT 0,
  enrolled_at         timestamptz NOT NULL DEFAULT now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  exited_at           timestamptz,
  paused_at           timestamptz,
  failed_at           timestamptz,
  exit_reason         text,
  failure_reason      text,
  next_action_at      timestamptz,
  steps_completed     integer NOT NULL DEFAULT 0,
  emails_sent         integer NOT NULL DEFAULT 0,
  emails_opened       integer NOT NULL DEFAULT 0,
  emails_clicked      integer NOT NULL DEFAULT 0,
  converted           boolean NOT NULL DEFAULT false,
  converted_at        timestamptz,
  step_history        jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT automation_enrollments_automation_id_fkey
    FOREIGN KEY (automation_id) REFERENCES automations (id) ON DELETE CASCADE,
  CONSTRAINT automation_enrollments_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- audit_logs
-- -------------------------------------------------------------------
CREATE TABLE audit_logs (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid NOT NULL,
  user_id           uuid,
  api_key_id        uuid,
  action            text NOT NULL,
  resource_type     text NOT NULL,
  resource_id       text,
  description       text,
  changes           jsonb,
  ip_address        text,
  user_agent        text,
  request_id        text,
  session_id        text,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_logs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- webhooks
-- -------------------------------------------------------------------
CREATE TABLE webhooks (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id         uuid NOT NULL,
  name                    text NOT NULL,
  description             text,
  url                     text NOT NULL,
  secret                  text NOT NULL,
  events                  webhook_event_type[] NOT NULL,
  is_active               boolean NOT NULL DEFAULT true,
  headers                 jsonb,
  timeout_ms              integer NOT NULL DEFAULT 30000,
  max_retries             integer NOT NULL DEFAULT 3,
  retry_delay_seconds     integer NOT NULL DEFAULT 60,
  last_triggered_at       timestamptz,
  last_success_at         timestamptz,
  last_failure_at         timestamptz,
  last_status_code        integer,
  last_error              text,
  total_triggers          integer NOT NULL DEFAULT 0,
  total_successes         integer NOT NULL DEFAULT 0,
  total_failures          integer NOT NULL DEFAULT 0,
  consecutive_failures    integer NOT NULL DEFAULT 0,
  disabled_at             timestamptz,
  disabled_reason         text,
  created_by              uuid,
  metadata                jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT webhooks_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- ============================================================
-- 5. INDEXES
-- ============================================================

-- contacts
CREATE INDEX idx_contacts_organization_id ON contacts (organization_id);
CREATE INDEX idx_contacts_email ON contacts (email);
CREATE INDEX idx_contacts_status ON contacts (status);
CREATE INDEX idx_contacts_engagement_score ON contacts (engagement_score);
CREATE INDEX idx_contacts_created_at ON contacts (created_at);
CREATE INDEX idx_contacts_tags ON contacts USING gin (tags);

-- campaigns
CREATE INDEX idx_campaigns_organization_id ON campaigns (organization_id);
CREATE INDEX idx_campaigns_status ON campaigns (status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns (scheduled_at);
CREATE INDEX idx_campaigns_type ON campaigns (type);

-- campaign_emails
CREATE INDEX idx_campaign_emails_campaign_id ON campaign_emails (campaign_id);
CREATE INDEX idx_campaign_emails_contact_id ON campaign_emails (contact_id);
CREATE INDEX idx_campaign_emails_status ON campaign_emails (status);
CREATE INDEX idx_campaign_emails_sent_at ON campaign_emails (sent_at);

-- email_events
CREATE INDEX idx_email_events_organization_id ON email_events (organization_id);
CREATE INDEX idx_email_events_campaign_id ON email_events (campaign_id);
CREATE INDEX idx_email_events_event_type ON email_events (event_type);
CREATE INDEX idx_email_events_timestamp ON email_events (timestamp);
CREATE INDEX idx_email_events_contact_id ON email_events (contact_id);

-- tracked_links
CREATE INDEX idx_tracked_links_campaign_id ON tracked_links (campaign_id);
CREATE INDEX idx_tracked_links_tracking_code ON tracked_links (tracking_code);

-- link_clicks
CREATE INDEX idx_link_clicks_tracked_link_id ON link_clicks (tracked_link_id);
CREATE INDEX idx_link_clicks_clicked_at ON link_clicks (clicked_at);

-- lists
CREATE INDEX idx_lists_organization_id ON lists (organization_id);

-- list_contacts
CREATE INDEX idx_list_contacts_list_id ON list_contacts (list_id);
CREATE INDEX idx_list_contacts_contact_id ON list_contacts (contact_id);

-- segments
CREATE INDEX idx_segments_organization_id ON segments (organization_id);

-- email_templates
CREATE INDEX idx_email_templates_organization_id ON email_templates (organization_id);
CREATE INDEX idx_email_templates_category ON email_templates (category);

-- audit_logs
CREATE INDEX idx_audit_logs_organization_id ON audit_logs (organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- suppression_list
CREATE INDEX idx_suppression_list_organization_id ON suppression_list (organization_id);
CREATE INDEX idx_suppression_list_email_address ON suppression_list (email_address);

-- automations
CREATE INDEX idx_automations_organization_id ON automations (organization_id);
CREATE INDEX idx_automations_status ON automations (status);

-- automation_enrollments
CREATE INDEX idx_automation_enrollments_automation_id ON automation_enrollments (automation_id);
CREATE INDEX idx_automation_enrollments_contact_id ON automation_enrollments (contact_id);
CREATE INDEX idx_automation_enrollments_status ON automation_enrollments (status);
CREATE INDEX idx_automation_enrollments_next_action_at ON automation_enrollments (next_action_at);

-- webhooks
CREATE INDEX idx_webhooks_organization_id ON webhooks (organization_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_custom_fields_updated_at
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_campaign_emails_updated_at
  BEFORE UPDATE ON campaign_emails
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_signup_forms_updated_at
  BEFORE UPDATE ON signup_forms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_automation_enrollments_updated_at
  BEFORE UPDATE ON automation_enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 7. EMAIL HASH TRIGGERS
-- ============================================================

-- contacts: auto-generate email_hash = md5(lower(email)) on INSERT and UPDATE
CREATE TRIGGER trg_contacts_email_hash
  BEFORE INSERT OR UPDATE OF email ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_email_hash();

-- suppression_list: auto-generate email_hash = md5(lower(email_address)) on INSERT and UPDATE
CREATE TRIGGER trg_suppression_list_email_hash
  BEFORE INSERT OR UPDATE OF email_address ON suppression_list
  FOR EACH ROW EXECUTE FUNCTION set_suppression_email_hash();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on ALL tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- RLS Policies: organizations
-- -----------------------------------------------------------------
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE USING (
    id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: organization_members
-- -----------------------------------------------------------------
CREATE POLICY "organization_members_select" ON organization_members
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "organization_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "organization_members_update" ON organization_members
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "organization_members_delete" ON organization_members
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: invitations
-- -----------------------------------------------------------------
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: api_keys
-- -----------------------------------------------------------------
CREATE POLICY "api_keys_select" ON api_keys
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "api_keys_update" ON api_keys
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "api_keys_delete" ON api_keys
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: contacts
-- -----------------------------------------------------------------
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: lists
-- -----------------------------------------------------------------
CREATE POLICY "lists_select" ON lists
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "lists_insert" ON lists
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "lists_update" ON lists
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "lists_delete" ON lists
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: list_contacts (join through lists)
-- -----------------------------------------------------------------
CREATE POLICY "list_contacts_select" ON list_contacts
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM lists WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "list_contacts_insert" ON list_contacts
  FOR INSERT WITH CHECK (
    list_id IN (
      SELECT id FROM lists WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "list_contacts_update" ON list_contacts
  FOR UPDATE USING (
    list_id IN (
      SELECT id FROM lists WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "list_contacts_delete" ON list_contacts
  FOR DELETE USING (
    list_id IN (
      SELECT id FROM lists WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------
-- RLS Policies: segments
-- -----------------------------------------------------------------
CREATE POLICY "segments_select" ON segments
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "segments_insert" ON segments
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "segments_update" ON segments
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "segments_delete" ON segments
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: custom_fields
-- -----------------------------------------------------------------
CREATE POLICY "custom_fields_select" ON custom_fields
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "custom_fields_insert" ON custom_fields
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "custom_fields_update" ON custom_fields
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "custom_fields_delete" ON custom_fields
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: email_templates
-- -----------------------------------------------------------------
CREATE POLICY "email_templates_select" ON email_templates
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "email_templates_insert" ON email_templates
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "email_templates_update" ON email_templates
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "email_templates_delete" ON email_templates
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: email_template_versions (join through email_templates)
-- -----------------------------------------------------------------
CREATE POLICY "email_template_versions_select" ON email_template_versions
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM email_templates WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "email_template_versions_insert" ON email_template_versions
  FOR INSERT WITH CHECK (
    template_id IN (
      SELECT id FROM email_templates WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "email_template_versions_update" ON email_template_versions
  FOR UPDATE USING (
    template_id IN (
      SELECT id FROM email_templates WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "email_template_versions_delete" ON email_template_versions
  FOR DELETE USING (
    template_id IN (
      SELECT id FROM email_templates WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------
-- RLS Policies: campaigns
-- -----------------------------------------------------------------
CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "campaigns_insert" ON campaigns
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "campaigns_update" ON campaigns
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "campaigns_delete" ON campaigns
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: campaign_emails (join through campaigns)
-- -----------------------------------------------------------------
CREATE POLICY "campaign_emails_select" ON campaign_emails
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "campaign_emails_insert" ON campaign_emails
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "campaign_emails_update" ON campaign_emails
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "campaign_emails_delete" ON campaign_emails
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------
-- RLS Policies: email_events
-- -----------------------------------------------------------------
CREATE POLICY "email_events_select" ON email_events
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "email_events_insert" ON email_events
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "email_events_update" ON email_events
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "email_events_delete" ON email_events
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: tracked_links (join through campaigns)
-- -----------------------------------------------------------------
CREATE POLICY "tracked_links_select" ON tracked_links
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "tracked_links_insert" ON tracked_links
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "tracked_links_update" ON tracked_links
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "tracked_links_delete" ON tracked_links
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------
-- RLS Policies: link_clicks (join through tracked_links -> campaigns)
-- -----------------------------------------------------------------
CREATE POLICY "link_clicks_select" ON link_clicks
  FOR SELECT USING (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN campaigns c ON c.id = tl.campaign_id
      WHERE c.organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "link_clicks_insert" ON link_clicks
  FOR INSERT WITH CHECK (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN campaigns c ON c.id = tl.campaign_id
      WHERE c.organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "link_clicks_update" ON link_clicks
  FOR UPDATE USING (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN campaigns c ON c.id = tl.campaign_id
      WHERE c.organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "link_clicks_delete" ON link_clicks
  FOR DELETE USING (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN campaigns c ON c.id = tl.campaign_id
      WHERE c.organization_id IN (SELECT get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------
-- RLS Policies: suppression_list
-- -----------------------------------------------------------------
CREATE POLICY "suppression_list_select" ON suppression_list
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "suppression_list_insert" ON suppression_list
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "suppression_list_update" ON suppression_list
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "suppression_list_delete" ON suppression_list
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: signup_forms
-- -----------------------------------------------------------------
CREATE POLICY "signup_forms_select" ON signup_forms
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "signup_forms_insert" ON signup_forms
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "signup_forms_update" ON signup_forms
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "signup_forms_delete" ON signup_forms
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: automations
-- -----------------------------------------------------------------
CREATE POLICY "automations_select" ON automations
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "automations_insert" ON automations
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "automations_update" ON automations
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "automations_delete" ON automations
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: automation_enrollments (join through automations)
-- -----------------------------------------------------------------
CREATE POLICY "automation_enrollments_select" ON automation_enrollments
  FOR SELECT USING (
    automation_id IN (
      SELECT id FROM automations WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "automation_enrollments_insert" ON automation_enrollments
  FOR INSERT WITH CHECK (
    automation_id IN (
      SELECT id FROM automations WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "automation_enrollments_update" ON automation_enrollments
  FOR UPDATE USING (
    automation_id IN (
      SELECT id FROM automations WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "automation_enrollments_delete" ON automation_enrollments
  FOR DELETE USING (
    automation_id IN (
      SELECT id FROM automations WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------
-- RLS Policies: audit_logs
-- -----------------------------------------------------------------
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "audit_logs_update" ON audit_logs
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "audit_logs_delete" ON audit_logs
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- -----------------------------------------------------------------
-- RLS Policies: webhooks
-- -----------------------------------------------------------------
CREATE POLICY "webhooks_select" ON webhooks
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "webhooks_insert" ON webhooks
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "webhooks_update" ON webhooks
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "webhooks_delete" ON webhooks
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );
