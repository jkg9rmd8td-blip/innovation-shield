INSERT INTO v2.workspace_change_logs (initiative_id, title, description, actor_id, actor_name)
SELECT i.id, 'Initial scope drafted', 'Problem statement and scope baseline documented.', 'innovator-demo', 'Demo Innovator'
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO v2.workspace_evaluator_notes (initiative_id, evaluator_id, evaluator_name, note, score_hint)
SELECT i.id, 'evaluator-demo', 'Demo Evaluator', 'Need clearer pilot success criteria and measurable KPI baseline.', 72
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO v2.workspace_ai_recommendations (initiative_id, recommendation, confidence, source)
SELECT i.id, 'Strengthen integration architecture and define data quality controls before committee review.', 0.83, 'recommendation-engine-v1'
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO v2.workspace_files (initiative_id, file_name, file_type, file_size_kb, object_key, uploaded_by)
SELECT i.id, 'prototype-spec-v1.pdf', 'pdf', 420, 'mock://prototype-spec-v1.pdf', 'innovator-demo'
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO v2.idea_maturity_scores (initiative_id, problem_clarity, feasibility, impact, risk, readiness, score, level, model_version)
SELECT i.id, 78, 73, 81, 66, 70, 74.8, 'Pilot Ready', 'ims-v1'
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO v2.impact_simulations (initiative_id, baseline, assumptions, projected, delta, confidence, model_version)
SELECT
  i.id,
  '{"timeDays":12,"costSar":180000,"qualityScore":71,"satisfactionScore":68}'::jsonb,
  '{"timeReductionPct":28,"costReductionPct":21,"qualityIncreasePct":16,"satisfactionIncreasePct":14}'::jsonb,
  '{"timeDays":8.64,"costSar":142200,"qualityScore":82.36,"satisfactionScore":77.52}'::jsonb,
  '{"timeDaysSaved":3.36,"costSarSaved":37800,"qualityGain":11.36,"satisfactionGain":9.52}'::jsonb,
  78,
  'impact-sim-v1'
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO v2.benchmark_runs (initiative_id, query_payload, ai_similarity, matches, knowledge_graph, web_api_used, source)
SELECT
  i.id,
  '{"title":"Smart Patient Journey","summary":"Improve triage and routing for faster care","keywords":["triage","patient-flow","automation"]}'::jsonb,
  0.54,
  '[{"id":"BM-100","title":"NHS Virtual Triage Pathway","similarity":0.61}]'::jsonb,
  '{"nodes":[{"id":"idea","label":"Idea"},{"id":"BM-100","label":"NHS Virtual Triage Pathway"}],"edges":[{"from":"idea","to":"BM-100","label":"0.61"}]}'::jsonb,
  FALSE,
  'local-benchmark-catalog-v1'
FROM v2.initiatives i
LIMIT 1
ON CONFLICT DO NOTHING;
