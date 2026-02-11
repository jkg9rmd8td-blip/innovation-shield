CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  status TEXT NOT NULL,
  average_score NUMERIC(6,2),
  judging_locked BOOLEAN NOT NULL DEFAULT FALSE,
  reward_total NUMERIC(12,2),
  reward_distribution JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS initiative_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL,
  judge_name TEXT NOT NULL,
  marks JSONB NOT NULL,
  score NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS governance_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  pledge_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS governance_confidentiality_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  operation TEXT NOT NULL,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_initiative_scores_initiative_id ON initiative_scores(initiative_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

INSERT INTO initiatives (title, owner_name, status)
SELECT 'تحسين رحلة المراجع الرقمية', 'فريق التحول', 'مسودة'
WHERE NOT EXISTS (SELECT 1 FROM initiatives LIMIT 1);

INSERT INTO initiatives (title, owner_name, status)
SELECT 'أتمتة إجراءات التشغيل الداخلية', 'فريق التشغيل الذكي', 'قيد التحكيم'
WHERE (SELECT count(*) FROM initiatives) = 1;
