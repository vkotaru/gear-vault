import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import logger from "./logger";

neonConfig.webSocketConstructor = ws;

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