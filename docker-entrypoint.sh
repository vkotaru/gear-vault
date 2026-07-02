#!/bin/sh
set -e

# Apply the database schema (idempotent — drizzle-kit only pushes diffs).
# Set SKIP_DB_PUSH=1 to skip this, e.g. if you manage migrations separately.
if [ "${SKIP_DB_PUSH:-0}" != "1" ]; then
  echo "==> Syncing database schema (drizzle-kit push)…"
  npm run db:push
fi

echo "==> Starting server on port ${PORT:-5000}…"
exec node dist/index.js
