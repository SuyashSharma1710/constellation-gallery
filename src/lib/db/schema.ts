import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const periods = pgTable("periods", {
  id: text("id").primaryKey(), // Wikidata ID, e.g. "Q4692"
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
  id: text("id").primaryKey(), // Wikidata ID, e.g. "Q762"
  periodId: text("period_id")
    .references(() => periods.id)
    .notNull(),
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
  period: one(periods, {
    fields: [artists.periodId],
    references: [periods.id],
  }),
  artworks: many(artworks),
}));

export const artworks = pgTable("artworks", {
  id: text("id").primaryKey(), // Wikidata ID
  artistId: text("artist_id")
    .references(() => artists.id)
    .notNull(),
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
  artist: one(artists, {
    fields: [artworks.artistId],
    references: [artists.id],
  }),
}));
