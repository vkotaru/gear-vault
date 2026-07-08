import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

/**
 * Deterministic, idempotent schema migration run on every container start.
 *
 * Unlike `drizzle-kit push` (which is interactive and silently no-ops without a
 * TTY), this applies plain idempotent DDL: it creates anything missing and adds
 * new columns to existing tables, so it is safe on both a fresh database and one
 * created by an earlier version. Keep it in sync with shared/schema.ts.
 *
 * The session table (user_sessions) is created by connect-pg-simple at runtime,
 * so it is intentionally not managed here.
 */
// Phase 1: enum types and values. Kept separate so newly-added enum values are
// committed before the schema phase uses them (Postgres forbids using a value
// added by ALTER TYPE ADD VALUE within the same transaction).
const ENUM_SQL = `
DO $$ BEGIN
  CREATE TYPE category AS ENUM ('camping','hiking','biking','water','winter','clothing','electronics','utilities','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TYPE category ADD VALUE IF NOT EXISTS 'clothing';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'electronics';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'utilities';

DO $$ BEGIN
  CREATE TYPE status AS ENUM ('stored','in_use','unknown','lent');
EXCEPTION WHEN duplicate_object THEN null; END $$;
-- Add the current status values to databases created with the old set
-- ('available','checked_out').
ALTER TYPE status ADD VALUE IF NOT EXISTS 'stored';
ALTER TYPE status ADD VALUE IF NOT EXISTS 'in_use';
ALTER TYPE status ADD VALUE IF NOT EXISTS 'unknown';
ALTER TYPE status ADD VALUE IF NOT EXISTS 'lent';
`;

// Phase 2: tables, columns and data migrations (may use enum values from phase 1).
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  google_id text UNIQUE,
  email text,
  display_name text,
  avatar_url text
);

CREATE TABLE IF NOT EXISTS locations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  description text,
  owner text,
  created_at timestamp NOT NULL DEFAULT now()
);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS owner text;

CREATE TABLE IF NOT EXISTS spots (
  id serial PRIMARY KEY,
  location_id integer NOT NULL REFERENCES locations(id),
  name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  brand text,
  category category NOT NULL,
  owner text NOT NULL,
  is_shared boolean NOT NULL DEFAULT true,
  location_id integer REFERENCES locations(id),
  spot_id integer REFERENCES spots(id),
  storage_location text NOT NULL,
  storage_address text,
  condition text DEFAULT 'Good',
  image_urls text[],
  status status NOT NULL DEFAULT 'stored',
  lent_to text,
  added_on timestamp NOT NULL DEFAULT now(),
  last_seen timestamp
);
ALTER TABLE items ADD COLUMN IF NOT EXISTS spot_id integer REFERENCES spots(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS lent_to text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS last_seen timestamp;
-- Migrate legacy statuses to the current set. Compare via ::text so the old
-- literals don't need to exist in the enum (they won't on a fresh install).
UPDATE items SET status = 'stored' WHERE status::text = 'available';
UPDATE items SET status = 'lent' WHERE status::text = 'checked_out';
ALTER TABLE items ALTER COLUMN status SET DEFAULT 'stored';

CREATE TABLE IF NOT EXISTS checkout_history (
  id serial PRIMARY KEY,
  item_id integer NOT NULL REFERENCES items(id),
  checked_out_by text NOT NULL,
  checked_out_on timestamp NOT NULL DEFAULT now(),
  due_back timestamp,
  returned_on timestamp
);

-- One-time backfill: legacy places created before ownership existed have a NULL
-- owner. Assign them to the sole user (only when there is exactly one), so a
-- single-user install needs no manual step. Multi-user installs are left
-- untouched to avoid mis-assigning.
UPDATE locations SET owner = (SELECT username FROM users ORDER BY id LIMIT 1)
WHERE owner IS NULL AND (SELECT count(*) FROM users) = 1;
`;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    // Separate queries so phase-1 enum additions commit before phase 2 uses them.
    await pool.query(ENUM_SQL);
    await pool.query(SCHEMA_SQL);
    console.log("Schema is up to date.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
