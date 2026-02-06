-- ============================================
-- MAILFORGE - Database Schema
-- ============================================

-- ============================================
-- ORGANISATIONS (TENANTS)
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,

  -- Email settings
  default_from_name TEXT NOT NULL,
  default_from_email TEXT NOT NULL,
  default_reply_to TEXT,

  -- Sending domain
  sending_domain TEXT,
  domain_verified BOOLEAN DEFAULT FALSE,
  dkim_verified BOOLEAN DEFAULT FALSE,
  spf_verified BOOLEAN DEFAULT FALSE,
  dmarc_verified BOOLEAN DEFAULT FALSE,

  -- Plan and limits
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  monthly_email_limit INTEGER DEFAULT 1000,
  monthly_emails_sent INTEGER DEFAULT 0,
  contact_limit INTEGER DEFAULT 500,

  -- White label branding
  primary_color TEXT DEFAULT '#6366f1',
  accent_color TEXT DEFAULT '#8b5cf6',
  custom_domain TEXT,

  -- GDPR
  dpo_email TEXT,
  privacy_policy_url TEXT,
  data_retention_days INTEGER DEFAULT 730,

  -- Metadata
  timezone TEXT DEFAULT 'Europe/Paris',
  locale TEXT DEFAULT 'fr',
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS AND ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'api_only')),

  can_manage_contacts BOOLEAN DEFAULT TRUE,
  can_create_campaigns BOOLEAN DEFAULT TRUE,
  can_send_campaigns BOOLEAN DEFAULT FALSE,
  can_manage_templates BOOLEAN DEFAULT TRUE,
  can_view_analytics BOOLEAN DEFAULT TRUE,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_manage_automations BOOLEAN DEFAULT TRUE,
  can_export_data BOOLEAN DEFAULT FALSE,
  can_manage_api_keys BOOLEAN DEFAULT FALSE,

  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

-- ============================================
-- API KEYS
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '["contacts:read", "contacts:write", "campaigns:read"]',

  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACTS
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,

  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  timezone TEXT,
  locale TEXT DEFAULT 'fr',

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'unsubscribed', 'bounced', 'complained', 'cleaned', 'pending'
  )),

  -- GDPR consent
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  consent_source TEXT,
  consent_ip TEXT,
  double_optin_confirmed BOOLEAN DEFAULT FALSE,
  double_optin_date TIMESTAMPTZ,

  -- Engagement
  engagement_score DECIMAL(5,2) DEFAULT 50.00,
  last_email_sent_at TIMESTAMPTZ,
  last_email_opened_at TIMESTAMPTZ,
  last_email_clicked_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_emails_clicked INTEGER DEFAULT 0,
  total_emails_bounced INTEGER DEFAULT 0,

  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  source TEXT,
  source_detail TEXT,

  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON contacts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_org_email ON contacts(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_org_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields ON contacts USING GIN(custom_fields);
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON contacts(organization_id, engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts(organization_id, last_activity_at DESC);

-- ============================================
-- LISTS
-- ============================================

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,

  type TEXT DEFAULT 'static' CHECK (type IN ('static', 'dynamic')),
  filter_conditions JSONB,

  double_optin_enabled BOOLEAN DEFAULT FALSE,
  confirmation_template_id UUID,

  contact_count INTEGER DEFAULT 0,
  active_contact_count INTEGER DEFAULT 0,

  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_contacts (
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  PRIMARY KEY (list_id, contact_id)
);

-- ============================================
-- SEGMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  conditions JSONB NOT NULL,

  cached_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOM FIELDS
-- ============================================

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'text', 'number', 'date', 'boolean',
    'select', 'multi_select', 'url', 'phone'
  )),

  options JSONB,
  default_value TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  is_visible_in_form BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  merge_tag TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, key)
);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom' CHECK (category IN (
    'custom', 'newsletter', 'promotion', 'transactional',
    'welcome', 'notification', 'event', 'survey'
  )),

  subject TEXT,
  preview_text TEXT,

  design_mode TEXT DEFAULT 'builder' CHECK (design_mode IN ('builder', 'code', 'react')),

  builder_json JSONB,
  html_content TEXT,
  react_source TEXT,
  mjml_source TEXT,
  text_content TEXT,

  thumbnail_url TEXT,

  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT FALSE,

  merge_tags_used TEXT[] DEFAULT '{}',

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  subject TEXT,
  preview_text TEXT,
  builder_json JSONB,
  html_content TEXT,
  react_source TEXT,
  text_content TEXT,

  change_note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'regular' CHECK (type IN (
    'regular', 'ab_test', 'automated', 'transactional', 'rss'
  )),

  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'
  )),

  template_id UUID REFERENCES email_templates(id),
  subject TEXT NOT NULL,
  preview_text TEXT,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,

  html_content TEXT,
  text_content TEXT,

  recipient_type TEXT DEFAULT 'list' CHECK (recipient_type IN ('list', 'segment', 'all', 'manual')),
  recipient_list_ids UUID[] DEFAULT '{}',
  recipient_segment_ids UUID[] DEFAULT '{}',
  exclude_list_ids UUID[] DEFAULT '{}',
  exclude_segment_ids UUID[] DEFAULT '{}',

  estimated_recipients INTEGER DEFAULT 0,

  scheduled_at TIMESTAMPTZ,
  send_started_at TIMESTAMPTZ,
  send_completed_at TIMESTAMPTZ,

  send_timezone_optimized BOOLEAN DEFAULT FALSE,
  send_throttle_per_hour INTEGER,

  ab_test_config JSONB,

  utm_source TEXT DEFAULT 'mailforge',
  utm_medium TEXT DEFAULT 'email',
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  stats JSONB DEFAULT '{
    "total_sent": 0,
    "total_delivered": 0,
    "total_opened": 0,
    "unique_opens": 0,
    "total_clicked": 0,
    "unique_clicks": 0,
    "total_bounced": 0,
    "hard_bounces": 0,
    "soft_bounces": 0,
    "total_unsubscribed": 0,
    "total_complained": 0,
    "total_forwarded": 0,
    "revenue_generated": 0
  }',

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_status ON campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';

-- ============================================
-- CAMPAIGN EMAILS
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  resend_email_id TEXT,
  ab_variant TEXT,

  status TEXT DEFAULT 'queued' CHECK (status IN (
    'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'
  )),

  personalized_subject TEXT,
  merge_data JSONB,

  queued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  bounce_type TEXT,
  bounce_reason TEXT,

  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT,
  email_client TEXT,
  os TEXT,
  browser TEXT
);

CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign ON campaign_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_contact ON campaign_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_status ON campaign_emails(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_sent ON campaign_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_queued ON campaign_emails(campaign_id) WHERE status = 'queued';

-- ============================================
-- EMAIL EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  campaign_email_id UUID REFERENCES campaign_emails(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'sent', 'delivered', 'opened', 'clicked',
    'bounced', 'complained', 'unsubscribed',
    'forwarded', 'converted', 'revenue'
  )),

  metadata JSONB DEFAULT '{}',

  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  email_client TEXT,
  os TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,

  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  revenue_amount DECIMAL(10,2),
  revenue_currency TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_org_type ON email_events(organization_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_campaign ON email_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_contact ON email_events(contact_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON email_events(occurred_at);

-- ============================================
-- TRACKED LINKS
-- ============================================

CREATE TABLE IF NOT EXISTS tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  tracking_url TEXT NOT NULL UNIQUE,

  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  campaign_email_id UUID REFERENCES campaign_emails(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  country TEXT,
  city TEXT,

  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPRESSION LIST
-- ============================================

CREATE TABLE IF NOT EXISTS suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_hash TEXT NOT NULL,

  reason TEXT NOT NULL CHECK (reason IN (
    'unsubscribed', 'hard_bounce', 'complaint', 'manual', 'list_unsubscribe'
  )),

  campaign_id UUID REFERENCES campaigns(id),
  suppressed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, email_hash)
);

CREATE INDEX IF NOT EXISTS idx_suppression_org_hash ON suppression_list(organization_id, email_hash);

-- ============================================
-- SIGNUP FORMS
-- ============================================

CREATE TABLE IF NOT EXISTS signup_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT DEFAULT 'embedded' CHECK (type IN (
    'embedded', 'popup', 'landing', 'flyout', 'bar'
  )),

  config JSONB NOT NULL,

  target_list_ids UUID[] DEFAULT '{}',
  tags_to_add TEXT[] DEFAULT '{}',

  double_optin_enabled BOOLEAN DEFAULT TRUE,
  confirmation_template_id UUID REFERENCES email_templates(id),

  slug TEXT,
  seo_title TEXT,
  seo_description TEXT,

  total_views INTEGER DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  total_confirmed INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTOMATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'contact_created', 'contact_added_to_list', 'contact_tag_added',
    'form_submitted', 'email_opened', 'email_clicked',
    'date_field', 'engagement_score_change', 'webhook', 'manual'
  )),
  trigger_config JSONB NOT NULL,

  steps JSONB NOT NULL DEFAULT '[]',

  total_entered INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_active INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  current_step_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited', 'paused', 'failed')),

  entered_at TIMESTAMPTZ DEFAULT NOW(),
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  step_history JSONB DEFAULT '[]',

  UNIQUE(automation_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_next_action ON automation_enrollments(next_action_at)
  WHERE status = 'active';

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,

  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_logs(organization_id, created_at DESC);

-- ============================================
-- WEBHOOKS
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  secret TEXT NOT NULL,

  events TEXT[] NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own org" ON organizations
  FOR ALL USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org members" ON organization_members
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org contacts" ON contacts
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org lists" ON lists
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org segments" ON segments
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org campaigns" ON campaigns
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org campaign_emails" ON campaign_emails
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org events" ON email_events
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org templates" ON email_templates
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org automations" ON automations
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org forms" ON signup_forms
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org audit_logs" ON audit_logs
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org suppression_list" ON suppression_list
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org webhooks" ON webhooks
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org api_keys" ON api_keys
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own org custom_fields" ON custom_fields
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_engagement_score(p_contact_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL;
  v_opens INTEGER;
  v_clicks INTEGER;
  v_sent INTEGER;
  v_last_activity INTERVAL;
BEGIN
  SELECT
    total_emails_opened,
    total_emails_clicked,
    total_emails_sent,
    NOW() - COALESCE(last_activity_at, created_at)
  INTO v_opens, v_clicks, v_sent, v_last_activity
  FROM contacts WHERE id = p_contact_id;

  IF v_sent = 0 THEN RETURN 50.00; END IF;

  v_score := (
    (LEAST(v_opens::DECIMAL / v_sent, 1.0) * 40) +
    (LEAST(v_clicks::DECIMAL / v_sent, 1.0) * 30) +
    (CASE
      WHEN v_last_activity < INTERVAL '7 days' THEN 30
      WHEN v_last_activity < INTERVAL '30 days' THEN 20
      WHEN v_last_activity < INTERVAL '90 days' THEN 10
      ELSE 0
    END)
  );

  UPDATE contacts SET engagement_score = v_score WHERE id = p_contact_id;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_contacts_updated BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_campaigns_updated BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_templates_updated BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_automations_updated BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_lists_updated BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_segments_updated BEFORE UPDATE ON segments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
