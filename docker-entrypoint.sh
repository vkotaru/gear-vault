#!/bin/sh
set -e

# Apply the database schema deterministically (idempotent DDL, no prompts).
# Set SKIP_MIGRATE=1 to skip, e.g. if you manage the schema separately.
if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  echo "==> Applying database schema…"
  node dist/migrate.js
fi

echo "==> Starting server on port ${PORT:-5000}…"
exec node dist/index.js
