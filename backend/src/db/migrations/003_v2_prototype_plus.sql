CREATE TABLE IF NOT EXISTS v2.prototype_collaboration_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  prototype_id UUID REFERENCES v2.prototypes(id) ON DELETE SET NULL,
  author_id TEXT,
  author_name TEXT,
  mention TEXT,
  comment_text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'portal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.prototype_collaboration_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  prototype_id UUID REFERENCES v2.prototypes(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB,
  actor_id TEXT,
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.prototype_builder_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES v2.initiatives(id) ON DELETE CASCADE,
  prototype_id UUID REFERENCES v2.prototypes(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL,
  title TEXT,
  payload JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_proto_comments_initiative
  ON v2.prototype_collaboration_comments(initiative_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_v2_proto_comments_prototype
  ON v2.prototype_collaboration_comments(prototype_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_v2_proto_activities_initiative
  ON v2.prototype_collaboration_activities(initiative_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_v2_proto_activities_prototype
  ON v2.prototype_collaboration_activities(prototype_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_v2_proto_artifacts_initiative
  ON v2.prototype_builder_artifacts(initiative_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_v2_proto_artifacts_type
  ON v2.prototype_builder_artifacts(initiative_id, artifact_type, version DESC);
