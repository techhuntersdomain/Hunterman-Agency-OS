-- Hunterman Agency OS - Business Research <-> Workflow links
-- Module: Local Growth Pipeline
--
-- Makes the link between a business_research record and the workflow run that
-- produced it queryable in the schema. Previously this lived only in
-- workflows.metadata / activity_log.details JSON.
--
-- Both columns are nullable: existing rows (and any future research created
-- outside a workflow) remain valid with NULL. ON DELETE SET NULL keeps a
-- research record intact if its workflow/step is later removed.

ALTER TABLE business_research
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_business_research_workflow ON business_research(workflow_id);
