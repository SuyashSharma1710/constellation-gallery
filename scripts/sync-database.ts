import "dotenv/config";
import { syncAllPeriods } from "../src/lib/data/sync";

async function main() {
  console.log("Starting database sync (Wikidata → Neon)...\n");

  if (!process.env.DATABASE_URL_POOLED && !process.env.DATABASE_URL) {
    console.error(
      "✗ DATABASE_URL_POOLED (or DATABASE_URL) is not set. Add it to .env.local before seeding."
    );
    process.exit(1);
  }

  const summary = await syncAllPeriods((message) => console.log(message));

  console.log(
    `\nSync complete. ${summary.succeeded}/${summary.total} periods synced.`
  );

  if (summary.failed > 0) {
    console.error(`${summary.failed} period(s) failed:`);
    for (const r of summary.results.filter((r) => !r.ok)) {
      console.error(`  - ${r.name} (${r.id}): ${r.error}`);
    }
  }

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
