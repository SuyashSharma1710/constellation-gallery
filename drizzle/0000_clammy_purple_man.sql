CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"name" text NOT NULL,
	"birth_year" text DEFAULT '' NOT NULL,
	"death_year" text DEFAULT '' NOT NULL,
	"portrait_url" text,
	"portrait_thumbnail_url" text,
	"local_position_x" real DEFAULT 0 NOT NULL,
	"local_position_y" real DEFAULT 0 NOT NULL,
	"local_position_z" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artworks" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"title" text NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"image_high_res_url" text NOT NULL,
	"image_thumbnail_url" text NOT NULL,
	"dimensions_width" integer DEFAULT 800 NOT NULL,
	"dimensions_height" integer DEFAULT 600 NOT NULL,
	"aspect_ratio" real DEFAULT 1 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"cosmos_position_x" real DEFAULT 0 NOT NULL,
	"cosmos_position_y" real DEFAULT 0 NOT NULL,
	"cosmos_position_z" real DEFAULT 0 NOT NULL,
	"gallery_model_path" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;