INSERT INTO v2.roles (key, label)
VALUES
  ('innovator', 'مبتكر'),
  ('evaluator', 'مقيّم'),
  ('manager', 'مدير الابتكار'),
  ('committee', 'لجنة الابتكار')
ON CONFLICT (key) DO NOTHING;

INSERT INTO v2.permissions (key, label)
VALUES
  ('initiative.create', 'Create initiative'),
  ('initiative.evaluate', 'Evaluate initiative'),
  ('initiative.approve', 'Approve initiative'),
  ('prototype.support.request', 'Request prototype support'),
  ('governance.pledge.sign', 'Sign governance pledge'),
  ('audit.read', 'Read audit log'),
  ('admin.access', 'Admin access')
ON CONFLICT (key) DO NOTHING;

INSERT INTO v2.users (id, name, department, locale)
VALUES
  ('innovator-demo', 'Demo Innovator', 'Innovation', 'ar'),
  ('evaluator-demo', 'Demo Evaluator', 'Quality', 'ar'),
  ('manager-demo', 'Demo Manager', 'Administration', 'ar')
ON CONFLICT (id) DO NOTHING;

INSERT INTO v2.user_roles (user_id, role_key)
VALUES
  ('innovator-demo', 'innovator'),
  ('evaluator-demo', 'evaluator'),
  ('manager-demo', 'manager')
ON CONFLICT (user_id, role_key) DO NOTHING;

INSERT INTO v2.initiatives (title, owner_id, owner_name, status, stage)
VALUES
  ('تحسين رحلة المريض الذكية', 'innovator-demo', 'Demo Innovator', 'draft', 'idea_submission'),
  ('أتمتة طلبات التشغيل', 'innovator-demo', 'Demo Innovator', 'in_review', 'evaluation')
ON CONFLICT DO NOTHING;

INSERT INTO v2.training_courses (key, title, level)
VALUES
  ('innovation-fundamentals', 'أساسيات الابتكار المؤسسي', 'beginner'),
  ('prototype-readiness', 'جاهزية النموذج الأولي', 'intermediate')
ON CONFLICT (key) DO NOTHING;

INSERT INTO v2.integrations (key, name, status, config)
VALUES
  ('ehr-connector', 'EHR Connector', 'active', '{"provider":"mock"}'::jsonb),
  ('mail-gateway', 'Mail Gateway', 'inactive', '{"provider":"mock"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
