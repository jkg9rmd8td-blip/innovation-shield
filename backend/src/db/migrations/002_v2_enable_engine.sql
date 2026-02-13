CREATE TABLE IF NOT EXISTS v2.committee_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  reviewer_id TEXT,
  reviewer_name TEXT,
  decision TEXT NOT NULL,
  technical_score NUMERIC(6,2),
  economic_score NUMERIC(6,2),
  final_score NUMERIC(6,2),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.workspace_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  actor_id TEXT,
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.workspace_evaluator_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  evaluator_id TEXT,
  evaluator_name TEXT,
  note TEXT NOT NULL,
  score_hint NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.workspace_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  confidence NUMERIC(6,4) NOT NULL DEFAULT 0.75,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  object_key TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.idea_maturity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES v2.initiatives(id) ON DELETE SET NULL,
  problem_clarity NUMERIC(6,2) NOT NULL,
  feasibility NUMERIC(6,2) NOT NULL,
  impact NUMERIC(6,2) NOT NULL,
  risk NUMERIC(6,2) NOT NULL,
  readiness NUMERIC(6,2) NOT NULL,
  score NUMERIC(6,2) NOT NULL,
  level TEXT NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.impact_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES v2.initiatives(id) ON DELETE SET NULL,
  baseline JSONB NOT NULL,
  assumptions JSONB NOT NULL,
  projected JSONB NOT NULL,
  delta JSONB NOT NULL,
  confidence NUMERIC(6,2) NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.benchmark_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES v2.initiatives(id) ON DELETE SET NULL,
  query_payload JSONB NOT NULL,
  ai_similarity NUMERIC(6,4) NOT NULL,
  matches JSONB NOT NULL,
  knowledge_graph JSONB NOT NULL,
  web_api_used BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_committee_reviews_initiative ON v2.committee_reviews(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_workspace_change_initiative ON v2.workspace_change_logs(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_workspace_notes_initiative ON v2.workspace_evaluator_notes(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_workspace_recs_initiative ON v2.workspace_ai_recommendations(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_workspace_files_initiative ON v2.workspace_files(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_ims_initiative ON v2.idea_maturity_scores(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_impact_initiative ON v2.impact_simulations(initiative_id);
CREATE INDEX IF NOT EXISTS idx_v2_benchmark_initiative ON v2.benchmark_runs(initiative_id);
