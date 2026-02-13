CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea_submission',
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  average_score NUMERIC(6,2),
  judging_locked BOOLEAN NOT NULL DEFAULT FALSE,
  reward_total NUMERIC(12,2),
  reward_distribution JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'idea_submission';
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS stage_history JSONB NOT NULL DEFAULT '[]'::jsonb;

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
CREATE INDEX IF NOT EXISTS idx_initiatives_stage ON initiatives(stage);

UPDATE initiatives
SET stage = CASE
  WHEN status = 'قيد التحكيم' THEN 'evaluation'
  WHEN status = 'قيد التطوير' THEN 'development'
  WHEN status = 'مرحلة التجربة' THEN 'pilot'
  WHEN status = 'معتمد' THEN 'approval'
  WHEN status = 'مطلق' THEN 'launch'
  WHEN status = 'مرفوض' THEN 'screening'
  ELSE 'idea_submission'
END
WHERE stage IS NULL OR stage = '';

UPDATE initiatives
SET stage_history = jsonb_build_array(
  jsonb_build_object(
    'stage', stage,
    'stageLabel', stage,
    'at', coalesce(created_at, now()),
    'by', 'system',
    'note', 'تهيئة السجل'
  )
)
WHERE stage_history IS NULL OR jsonb_typeof(stage_history) <> 'array' OR jsonb_array_length(stage_history) = 0;

INSERT INTO initiatives (title, owner_name, status, stage, stage_history)
SELECT
  'تحسين رحلة المراجع الرقمية',
  'فريق التحول',
  'مسودة',
  'idea_submission',
  jsonb_build_array(
    jsonb_build_object(
      'stage', 'idea_submission',
      'stageLabel', 'تقديم الفكرة',
      'at', now(),
      'by', 'system',
      'note', 'تسجيل المبادرة'
    )
  )
WHERE NOT EXISTS (SELECT 1 FROM initiatives LIMIT 1);

INSERT INTO initiatives (title, owner_name, status, stage, stage_history)
SELECT
  'أتمتة إجراءات التشغيل الداخلية',
  'فريق التشغيل الذكي',
  'قيد التحكيم',
  'evaluation',
  jsonb_build_array(
    jsonb_build_object(
      'stage', 'idea_submission',
      'stageLabel', 'تقديم الفكرة',
      'at', now(),
      'by', 'system',
      'note', 'تسجيل الفكرة'
    ),
    jsonb_build_object(
      'stage', 'screening',
      'stageLabel', 'الفرز الأولي',
      'at', now(),
      'by', 'system',
      'note', 'اجتياز الفرز'
    ),
    jsonb_build_object(
      'stage', 'evaluation',
      'stageLabel', 'التقييم',
      'at', now(),
      'by', 'system',
      'note', 'التحويل للتحكيم'
    )
  )
WHERE (SELECT count(*) FROM initiatives) = 1;
