# Innovation Shield V2 Implementation (Initial Cut)

## Delivered in this implementation
1. New frontend architecture under `frontend/` with separate portals:
   - `frontend/portals/employee`
   - `frontend/portals/judging`
   - `frontend/portals/admin`
2. Shared layers:
   - `frontend/shared/design-system`
   - `frontend/shared/styles`
   - `frontend/shared/i18n`
   - `frontend/shared/core`
   - `frontend/shared/shell`
3. New backend API contract mounted at:
   - `/api/v2/*`
   - `/api/*` compatibility alias
4. New backend module layout:
   - `backend/src/modules/*`
   - `backend/src/platform/http/*`
   - `backend/src/routes/v2/*`
5. V2 schema + seeds + ETL tooling:
   - `backend/src/db/migrations/001_v2_schema.sql`
   - `backend/src/db/seeds/001_v2_seed.sql`
   - `backend/src/db/seeds/import-legacy.js`

## Response contract
- Success: `{ data, meta }`
- Error: `{ error: { code, message, details } }`

## Compatibility strategy
- Existing top-level and admin pages are now redirect wrappers pointing to V2 portal URLs.
- Legacy print/profile endpoints under `app/` are redirected to V2 destinations.

## Notes
- Current auth mode is demo-oriented (`/api/v2/auth/session`).
- ETL tool merges legacy Postgres + JSON + local snapshot data and emits a report.
