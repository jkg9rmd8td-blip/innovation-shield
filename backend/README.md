# Innovation Shield Backend

Node.js + Express + PostgreSQL backend with:
- Role matrix + permission guard + middleware
- Initiative workflow APIs
- Professional judging flow (rubric, averages, rewards, lock state)
- Governance layer (pledge, confidentiality approval, logs)
- Audit log with `before/after` snapshots

## 1) Setup

```bash
cd backend
cp .env.example .env
npm install
```

## 2) Run PostgreSQL

```bash
docker compose up -d
```

## 3) Run migrations

```bash
npm run db:migrate
```

## 4) Start server

```bash
npm run dev
```

Server default: `http://localhost:8080`

## Auth (Demo token)

```bash
curl -X POST http://localhost:8080/auth/session \
  -H 'Content-Type: application/json' \
  -d '{"name":"مدير الابتكار","role":"executive"}'
```

Use returned `token`:

```bash
-H "Authorization: Bearer <TOKEN>"
```

## Key endpoints

- `GET /access/role-matrix`
- `GET /initiatives`
- `POST /initiatives`
- `PATCH /initiatives/:id/status`
- `POST /judging/:id/evaluate`
- `POST /judging/:id/lock`
- `POST /judging/:id/reward`
- `POST /governance/pledge`
- `POST /governance/confidentiality`
- `GET /governance/logs`
- `GET /audit`

## Notes

- All critical flows write to `audit_logs` with `user`, `operation`, `action`, `before_state`, `after_state`.
- Permission model lives in `src/core/roleMatrix.js`.
- Update role/permission logic without touching UI.
