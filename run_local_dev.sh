#!/usr/bin/env bash
#
# run_local_dev.sh — launch Gear Vault locally for development.
#
# What it does:
#   1. Ensures a .env file exists (bootstrapping from .env.example).
#   2. Installs npm dependencies if they're missing.
#   3. Verifies the PostgreSQL database in DATABASE_URL is reachable.
#   4. Pushes the Drizzle schema to the database.
#   5. Starts the dev server (client + API on one port) with hot reload.
#
# Usage: ./run_local_dev.sh

set -euo pipefail

# Always run from the repository root (this script's directory).
cd "$(dirname "$0")"

# --- Terminal colors -------------------------------------------------------
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}==>${NC} $1"; }
ok()    { echo -e "${GREEN}✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail()  { echo -e "${RED}❌ $1${NC}" >&2; exit 1; }

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}🎒 Gear Vault — Local Development${NC}"
echo -e "${BLUE}============================================${NC}"

# --- 1. Prerequisites ------------------------------------------------------
command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install Node 20+ and retry."
command -v npm  >/dev/null 2>&1 || fail "npm is not installed."
info "Using Node $(node -v)"

# --- 2. Environment file ---------------------------------------------------
if [ ! -f ".env" ]; then
  warn "No .env file found. Creating one from .env.example."
  cp .env.example .env
  warn "Edit .env and set DATABASE_URL before continuing if the default doesn't match your setup."
fi

# Load .env into this script's environment (for the DB pre-flight checks below).
set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DATABASE_URL:?DATABASE_URL is not set. Add it to .env (see .env.example).}"
export NODE_ENV="${NODE_ENV:-development}"

# --- 3. Dependencies -------------------------------------------------------
# Check for a real linked binary, not just the node_modules directory — a
# partial/interrupted install leaves node_modules present but .bin empty.
if [ ! -x "node_modules/.bin/tsx" ] || [ ! -x "node_modules/.bin/drizzle-kit" ]; then
  info "Installing dependencies (missing or incomplete)…"
  npm install
  ok "Dependencies installed."
else
  info "Dependencies already installed."
fi

# --- 4. Database connectivity ----------------------------------------------
# Use a real authenticated query (SELECT 1), not pg_isready — pg_isready only
# reports whether the server accepts connections, not whether the role,
# password, and database in DATABASE_URL actually work.
if command -v psql >/dev/null 2>&1; then
  info "Checking database connection…"
  if psql "$DATABASE_URL" -tAc "SELECT 1" >/dev/null 2>&1; then
    ok "Database connection verified."
  else
    warn "Could not connect to the database with DATABASE_URL:"
    warn "    $DATABASE_URL"
    warn "Common fixes:"
    warn "  • Start PostgreSQL (e.g. 'brew services start postgresql')."
    warn "  • Create the database:  createdb <dbname>"
    warn "  • Homebrew Postgres has no 'postgres' role — use your OS user,"
    warn "    e.g. DATABASE_URL=postgres://$(whoami)@localhost:5432/gearvault"
    fail "Database connection failed — fix DATABASE_URL in .env, then retry."
  fi
else
  warn "psql not found; skipping DB pre-flight check (the app will fail loudly if the DB is down)."
fi

# --- 5. Schema sync --------------------------------------------------------
# drizzle-kit push can exit 0 even when it hits a DB error, so 'set -e' won't
# catch it — verify the push actually landed a table afterwards.
info "Syncing database schema (drizzle-kit push)…"
npm run db:push
if command -v psql >/dev/null 2>&1; then
  if ! psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.items')" 2>/dev/null | grep -q items; then
    fail "Schema push did not create the expected tables — see the drizzle-kit output above."
  fi
fi
ok "Schema is up to date."

# --- 6. Launch -------------------------------------------------------------
info "Starting dev server on http://localhost:${PORT:-5000}"
info "(Development mode auto-seeds sample data and auto-logs you in as the 'dev' user.)"
echo -e "${BLUE}--------------------------------------------${NC}"
exec npm run dev
