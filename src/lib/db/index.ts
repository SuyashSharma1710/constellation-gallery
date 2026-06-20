import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  // Not fatal: the repository catches DB failures and falls back to static
  // JSON datasets. We only warn so misconfiguration is visible in logs.
  console.warn(
    "[db] DATABASE_URL_POOLED / DATABASE_URL is not set — runtime reads will fall back to static JSON datasets."
  );
}

// `neon()` validates the string format at construction time, so the unset
// placeholder must be well-formed. It points at an unreachable host and fails
// on first query, triggering the repository's JSON fallback chain.
const sql = neon(
  connectionString ??
    "postgresql://placeholder:placeholder@localhost/placeholder?sslmode=require"
);

export const db = drizzle(sql, { schema });

export const isDatabaseConfigured = Boolean(connectionString);
