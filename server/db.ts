import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import logger from "./logger";

if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL not set in environment");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

logger.info("Connecting to PostgreSQL database");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
logger.info("Successfully connected to PostgreSQL database");

export { pool, db };