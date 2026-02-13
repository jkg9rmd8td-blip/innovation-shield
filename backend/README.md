# Innovation Shield Backend

Node.js + Express + PostgreSQL backend جاهز كنواة إنتاجية أولية.

## Features
- JWT access token موقّع (HMAC-SHA256) مع `exp` و `iss`
- Role Matrix + Permission Guard على مستوى API
- مبادرات + تحكيم + حوكمة + سجل تدقيق before/after
- مسار الابتكار عبر `stage` و `stage_history`

## Setup
```bash
cd backend
cp .env.example .env
npm install
```

## Database
```bash
docker compose up -d
npm run db:migrate
npm run db:seed
```

## Run
```bash
npm run dev
```
Server: `http://localhost:8080`

## Auth
### Create session
```bash
curl -X POST http://localhost:8080/auth/session \
  -H 'Content-Type: application/json' \
  -d '{"name":"مدير الابتكار","role":"manager"}'
```

### Validate current token
```bash
curl http://localhost:8080/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Core endpoints
- `GET /access/role-matrix` (requires admin access page permission)
- `GET /initiatives`
- `POST /initiatives`
- `PATCH /initiatives/:id/status`
- `PATCH /initiatives/:id/stage`
- `POST /initiatives/:id/approve`
- `POST /initiatives/:id/reject`
- `POST /judging/:id/evaluate`
- `POST /judging/:id/lock`
- `POST /judging/:id/reward`
- `POST /governance/pledge`
- `POST /governance/confidentiality`
- `GET /governance/logs`
- `GET /audit`

## V2 API (New Contract)
- Base routes:
  - `GET /api/v2/health`
  - `POST /api/v2/auth/session`
  - `GET /api/v2/auth/me`
  - `GET|POST|PATCH /api/v2/initiatives`
  - `POST /api/v2/judging/:initiativeId/scores`
  - `GET|POST /api/v2/prototypes`
  - `GET /api/v2/prototypes/portfolio`
  - `GET /api/v2/prototypes/compare?ids=<id1,id2,...>`
  - `GET /api/v2/prototypes/:prototypeId/timeline`
  - `POST /api/v2/governance/pledges`
  - `GET /api/v2/audit`
  - `GET /api/v2/access/role-matrix`
  - `GET|POST /api/v2/services`
  - `GET|POST /api/v2/marketplace`
  - `GET|POST /api/v2/integrations`
  - `POST /api/v2/integrations/:id/sync`
  - `GET|POST /api/v2/training/catalog`
  - `GET|POST /api/v2/training/progress`
  - `GET|POST /api/v2/notifications`
  - `POST /api/v2/notifications/:id/read`
  - `GET /api/v2/engine/workflow`
  - `POST /api/v2/engine/:initiativeId/evaluate`
  - `POST /api/v2/engine/:initiativeId/committee`
  - `POST /api/v2/engine/:initiativeId/pilot`
  - `POST /api/v2/engine/:initiativeId/approve`
  - `POST /api/v2/engine/:initiativeId/deploy`
  - `GET /api/v2/prototype-builder/templates`
  - `POST /api/v2/prototype-builder/pitch-deck`
  - `POST /api/v2/prototype-builder/use-cases`
  - `POST /api/v2/prototype-builder/writing-assistant`
  - `POST /api/v2/prototype-builder/mockup`
  - `GET /api/v2/prototype-builder/artifacts?initiativeId=<id>`
  - `POST /api/v2/prototype-builder/artifacts`
  - `POST /api/v2/prototype-builder/export-pack`
  - `GET /api/v2/collaboration/:initiativeId`
  - `POST /api/v2/collaboration/:initiativeId/comments`
  - `POST /api/v2/collaboration/:initiativeId/activities`
  - `GET /api/v2/workspace/:initiativeId`
  - `POST /api/v2/workspace/:initiativeId/changes`
  - `POST /api/v2/workspace/:initiativeId/evaluator-notes`
  - `POST /api/v2/workspace/:initiativeId/recommendations`
  - `POST /api/v2/workspace/:initiativeId/files`
  - `POST /api/v2/scoring/idea-maturity`
  - `GET /api/v2/scoring/idea-maturity`
  - `POST /api/v2/impact/simulate`
  - `GET /api/v2/impact/simulations`
  - `GET /api/v2/benchmarking/catalog`
  - `POST /api/v2/benchmarking/global`
  - `GET /api/v2/benchmarking/runs`
  - `GET /api/v2/analytics/dashboard`
- Success envelope: `{ data, meta }`
- Error envelope: `{ error: { code, message, details } }`
- Compatibility alias is enabled on `/api/*`.

## V2 Scripts
```bash
npm run db:migrate
npm run db:seed
npm run db:etl:legacy
```

## Notes
- جميع الإجراءات الحرجة تُسجّل في `audit_logs` مع `before_state` و `after_state`.
- في وضع صارم `AUTH_STRICT=true` يجب تمرير `passcode` في `/auth/session`.
