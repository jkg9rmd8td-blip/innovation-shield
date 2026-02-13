#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

STAMP="$(date +%Y%m%d-%H%M)"
ARCHIVE="../innovation-shield-legacy-${STAMP}"
TAG="legacy-pre-v2-$(date +%Y%m%d)"

mkdir -p "$ARCHIVE"
tar --exclude='./backend/node_modules' --exclude='./.git' -cf - . | tar -xf - -C "$ARCHIVE"
mkdir -p "$ARCHIVE/BASELINE_SNAPSHOTS"

git status --short > "$ARCHIVE/BASELINE_GIT_STATUS.txt"
git log --oneline -n 20 > "$ARCHIVE/BASELINE_GIT_LOG.txt"
cp -a app/data "$ARCHIVE/BASELINE_SNAPSHOTS/app-data"
[ -d app/employee/data ] && cp -a app/employee/data "$ARCHIVE/BASELINE_SNAPSHOTS/app-employee-data"
cp -a backend/src/db/schema.sql "$ARCHIVE/BASELINE_SNAPSHOTS/backend-schema.sql"

cat > "$ARCHIVE/BASELINE_LOCALSTORAGE_KEYS.md" <<'KEYS'
# LocalStorage Keys Snapshot

- `is_state_v1`
- `is_employee_print_v1`
- `IS_API_BASE`
- `is_minutes_payload_v1`
- `IS_AUTH_TOKEN`
- `IS_AUTH_USER`
- `is_employee_pro_ui_v1`
KEYS

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  TAG="${TAG}-$(date +%H%M)"
fi

git tag "$TAG"

echo "Archive: $ARCHIVE"
echo "Tag: $TAG"
