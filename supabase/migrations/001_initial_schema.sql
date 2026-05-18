-- Hunterman Agency OS - Initial Schema
-- Module: Local Growth Pipeline

-- Enums
CREATE TYPE lead_status AS ENUM (
  'new', 'researching', 'qualified', 'demo_ready',
  'outreach', 'negotiating', 'won', 'lost', 'dormant'
);

CREATE TYPE workflow_status AS ENUM (
  'pending', 'running', 'paused', 'completed', 'failed', 'cancelled'
);

-- Core Tables

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'development')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  location TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  source TEXT,
  notes TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id),
  lead_id UUID REFERENCES leads(id),
  name TEXT NOT NULL,
  status workflow_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  agent_type TEXT,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Pipeline-Specific Tables (Local Growth)

CREATE TABLE business_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  current_website TEXT,
  has_website BOOLEAN DEFAULT false,
  google_rating NUMERIC(2,1),
  review_count INTEGER,
  competitors JSONB DEFAULT '[]',
  market_notes TEXT,
  tech_stack JSONB DEFAULT '[]',
  researched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE demo_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id),
  url TEXT,
  template TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'sent', 'viewed', 'expired')),
  preview_image TEXT,
  generated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'linkedin', 'phone', 'other')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'replied', 'bounced')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE production_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id),
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposal' CHECK (status IN ('proposal', 'accepted', 'in_progress', 'review', 'launched', 'cancelled')),
  domain TEXT,
  hosting_provider TEXT,
  monthly_value NUMERIC(10,2),
  start_date DATE,
  launch_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  actor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_lead ON workflows(lead_id);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_business_research_lead ON business_research(lead_id);
CREATE INDEX idx_demo_sites_lead ON demo_sites(lead_id);
CREATE INDEX idx_outreach_lead ON outreach_messages(lead_id);
CREATE INDEX idx_production_projects_lead ON production_projects(lead_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER production_projects_updated_at
  BEFORE UPDATE ON production_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users can access everything - internal tool)
CREATE POLICY "Authenticated access" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON workflows FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON workflow_steps FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON business_research FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON demo_sites FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON outreach_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON production_projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON activity_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated access" ON modules FOR ALL TO authenticated USING (true);

-- Seed the Local Growth Pipeline module
INSERT INTO modules (name, slug, description, status, config) VALUES (
  'Local Growth Pipeline',
  'local-growth',
  'End-to-end lead generation for local businesses: research → demo site → outreach → close',
  'active',
  '{"pipelines": ["local-growth-full", "demo-only", "outreach-only"]}'
);
