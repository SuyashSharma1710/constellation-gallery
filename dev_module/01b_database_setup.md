# Module 01b — Database Setup & Seed Script

**Priority:** P0 | **Est. Days:** 2 | **Depends On:** 00

## Objective

Set up the Neon (serverless Postgres) database with Drizzle ORM: define the schema, configure migrations, create a Drizzle client, and build the seed/sync script that fetches data from Wikidata/Wikimedia and upserts it into Neon. The runtime app reads exclusively from Neon — no external API calls at request time.

## Tasks

### 01b.1 Neon Database Setup

- Create a Neon project at [neon.tech](https://neon.tech).
- Create a database (e.g., `constellation_gallery`).
- Copy the pooled connection string (`DATABASE_URL_POOLED`) for serverless environments.
- Add to `.env.local`:
  ```env
  DATABASE_URL=postgresql://...
  DATABASE_URL_POOLED=postgresql://...?sslmode=require&pgbouncer=true
  ```
- Add `.env.local` to `.gitignore` (already default for Next.js).

### 01b.2 Drizzle Configuration

**File:** `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**File:** `src/lib/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL_POOLED!);
export const db = drizzle(sql, { schema });
```

### 01b.3 Drizzle Schema

**File:** `src/lib/db/schema.ts`

Define the Postgres schema matching the existing `PeriodConstellation`, `ArtistNode`, and `Artwork` TypeScript types. Three normalized tables with foreign key relationships:

```typescript
import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const periods = pgTable("periods", {
  id: text("id").primaryKey(),                    // Wikidata ID, e.g. "Q4692"
  name: text("name").notNull(),
  description: text("description").notNull(),
  cosmosPositionX: real("cosmos_position_x").notNull().default(0),
  cosmosPositionY: real("cosmos_position_y").notNull().default(0),
  cosmosPositionZ: real("cosmos_position_z").notNull().default(0),
  galleryModelPath: text("gallery_model_path").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const periodsRelations = relations(periods, ({ many }) => ({
  artists: many(artists),
}));

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),                    // Wikidata ID, e.g. "Q762"
  periodId: text("period_id").references(() => periods.id).notNull(),
  name: text("name").notNull(),
  birthYear: text("birth_year").notNull().default(""),
  deathYear: text("death_year").notNull().default(""),
  portraitUrl: text("portrait_url"),
  portraitThumbnailUrl: text("portrait_thumbnail_url"),
  localPositionX: real("local_position_x").notNull().default(0),
  localPositionY: real("local_position_y").notNull().default(0),
  localPositionZ: real("local_position_z").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artistsRelations = relations(artists, ({ one, many }) => ({
  period: one(periods, { fields: [artists.periodId], references: [periods.id] }),
  artworks: many(artworks),
}));

export const artworks = pgTable("artworks", {
  id: text("id").primaryKey(),                    // Wikidata ID
  artistId: text("artist_id").references(() => artists.id).notNull(),
  title: text("title").notNull(),
  year: text("year").notNull().default(""),
  imageHighResUrl: text("image_high_res_url").notNull(),
  imageThumbnailUrl: text("image_thumbnail_url").notNull(),
  dimensionsWidth: integer("dimensions_width").notNull().default(800),
  dimensionsHeight: integer("dimensions_height").notNull().default(600),
  aspectRatio: real("aspect_ratio").notNull().default(1),
  description: text("description").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artworksRelations = relations(artworks, ({ one }) => ({
  artist: one(artists, { fields: [artworks.artistId], references: [artists.id] }),
}));
```

### 01b.4 Generate & Run Migrations

```bash
npm run db:generate    # Generate SQL migration files from schema
npm run db:migrate     # Apply migrations to Neon
```

After migration, verify via Drizzle Studio:
```bash
npm run db:studio      # Opens http://localhost:4983 for visual browsing
```

### 01b.5 Seed / Sync Script

**File:** `scripts/sync-database.ts`

A standalone script (not bundled with Next.js) that:

1. **Loads environment variables** via `dotenv` (`DATABASE_URL_POOLED`).
2. **For each period** in `PERIOD_CONFIG` (Renaissance, Baroque, Impressionism, Romanticism, Surrealism, Modern Art):
   - Calls `queryWikidata(periodId)` from `src/lib/data/wikidata.ts`.
   - Calls `fetchWikimediaImages(filenames)` from `src/lib/data/wikimedia.ts`.
   - Calls `transformRawData(...)` from `src/lib/data/transformer.ts`.
   - Computes `cosmosPosition` via `constellationLayout()` from `src/lib/utils/math.ts`.
   - Upserts the period, its artists, and artworks into Neon using Drizzle.
3. **Upsert logic** (idempotent, safe to run multiple times):
   ```typescript
   // Period
   await db.insert(periods).values(periodRow).onConflictDoUpdate({
     target: periods.id,
     set: { ...periodRow },
   });
   // Artists
   for (const artist of artists) {
     await db.insert(artists).values(artistRow).onConflictDoUpdate({
       target: artists.id,
       set: { ...artistRow },
     });
   }
   // Artworks
   for (const artwork of artworks) {
     await db.insert(artworks).values(artworkRow).onConflictDoUpdate({
       target: artworks.id,
       set: { ...artworkRow },
     });
   }
   ```
4. **Error handling:** If Wikidata fails for a period, log the error, skip the period, and continue with the next. Neon retains the last successful sync for that period.
5. **Exit code:** Non-zero if any period failed, for CI/CD monitoring.

```typescript
// scripts/sync-database.ts (sketch)
import "dotenv/config";
import { db } from "../src/lib/db";
import { periods, artists, artworks } from "../src/lib/db/schema";
import { queryWikidata } from "../src/lib/data/wikidata";
import { fetchWikimediaImages } from "../src/lib/data/wikimedia";
import { transformRawData } from "../src/lib/data/transformer";
import { constellationLayout } from "../src/lib/utils/math";

const PERIOD_CONFIG: Record<string, { name: string; description: string }> = {
  Q4692:  { name: "Renaissance",   description: "..." },
  Q37853: { name: "Baroque",       description: "..." },
  Q40415: { name: "Impressionism", description: "..." },
  Q37068: { name: "Romanticism",   description: "..." },
  Q39427: { name: "Surrealism",    description: "..." },
  Q38166: { name: "Modern Art",    description: "..." },
};

async function syncAll() {
  const periodIds = Object.keys(PERIOD_CONFIG);
  const layout = constellationLayout(periodIds.length, 18);
  let errors = 0;

  for (let i = 0; i < periodIds.length; i++) {
    const id = periodIds[i];
    const config = PERIOD_CONFIG[id];
    const pos = layout[i];

    try {
      console.log(`Syncing ${config.name} (${id})...`);

      const rawData = await queryWikidata(id);
      if (!rawData.ok) throw new Error(rawData.error);

      const filenames = collectAllImageFilenames(rawData.data);
      const commonsResult = await fetchWikimediaImages(filenames);
      const commonsImages = commonsResult.ok ? commonsResult.data : [];

      const constellation = transformRawData(
        rawData.data, commonsImages, id, config.name, config.description
      );
      constellation.cosmosPosition = pos;

      await db.insert(periods).values({
        id: constellation.id,
        name: constellation.name,
        description: constellation.description,
        cosmosPositionX: pos.x,
        cosmosPositionY: pos.y,
        cosmosPositionZ: pos.z,
        galleryModelPath: constellation.galleryModelPath,
      }).onConflictDoUpdate({
        target: periods.id,
        set: { name: constellation.name, description: constellation.description,
               cosmosPositionX: pos.x, cosmosPositionY: pos.y, cosmosPositionZ: pos.z,
               galleryModelPath: constellation.galleryModelPath, updatedAt: new Date() },
      });

      for (const artist of constellation.artists) {
        await db.insert(artists).values({ ... }).onConflictDoUpdate({ target: artists.id, set: { ... } });
        for (const artwork of artist.artworks) {
          await db.insert(artworks).values({ ... }).onConflictDoUpdate({ target: artworks.id, set: { ... } });
        }
      }

      console.log(`  ✓ ${config.name}: ${constellation.artists.length} artists, ${totalArtworks} artworks`);
    } catch (err) {
      console.error(`  ✗ ${config.name}: ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  console.log(`\nSync complete. ${periodIds.length - errors}/${periodIds.length} periods synced.`);
  process.exit(errors > 0 ? 1 : 0);
}

syncAll();
```

### 01b.6 Vercel Cron Job (Scheduled Sync)

**File:** `src/app/api/cron/sync-database/route.ts`

A Next.js API route (protected by a cron secret) that triggers the sync logic. Configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/sync-database",
    "schedule": "0 0 * * 0"
  }]
}
```

- The route verifies the `Authorization` header matches `CRON_SECRET` env var.
- Calls the same sync logic as `scripts/sync-database.ts` (extracted as a shared function).
- Returns JSON with sync results.

### 01b.7 Environment Variables Summary

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon connection string (for Drizzle Kit migrations) |
| `DATABASE_URL_POOLED` | Yes | Neon pooled connection string (for serverless runtime) |
| `CRON_SECRET` | Yes (production) | Secret for securing the Vercel Cron endpoint |

## Deliverables

- [ ] Neon project created with `constellation_gallery` database
- [ ] `.env.local` configured with `DATABASE_URL` and `DATABASE_URL_POOLED`
- [ ] `drizzle.config.ts` configured
- [ ] `src/lib/db/schema.ts` defines all 3 tables with relations
- [ ] `src/lib/db/index.ts` exports a Drizzle client
- [ ] `npm run db:generate` produces migration files
- [ ] `npm run db:migrate` applies migrations to Neon
- [ ] `scripts/sync-database.ts` seeds all 6 periods with artists and artworks
- [ ] `npm run sync-database` runs successfully
- [ ] Vercel Cron job configured for weekly sync
- [ ] `npm run db:studio` opens Drizzle Studio for visual data browsing

## Validation

```bash
# Test database connection
node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL_POOLED); sql\`SELECT 1\`.then(console.log)"

# Generate and apply migrations
npm run db:generate
npm run db:migrate

# Run seed script
npm run sync-database

# Verify data in Drizzle Studio
npm run db:studio

# Check row counts
node -e "const { db } = require('./src/lib/db'); db.select({ count: sql\`count(*)\` }).from(periods).then(console.log)"
```