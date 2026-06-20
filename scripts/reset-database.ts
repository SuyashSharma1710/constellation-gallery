import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const conn = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;
  if (!conn) {
    console.error("✗ No DATABASE_URL set.");
    process.exit(1);
  }
  const sql = neon(conn);
  // Order respects FKs (artworks → artists → periods). CASCADE is belt-and-braces.
  await sql`TRUNCATE TABLE artworks, artists, periods RESTART IDENTITY CASCADE`;
  console.log("✓ Truncated artworks, artists, periods.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Truncate failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
