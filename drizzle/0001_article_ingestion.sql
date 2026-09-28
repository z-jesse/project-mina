ALTER TABLE "articles" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "kind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "feed_url" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "feed_guid" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "imported_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "summary_is_ai" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_outlet_feed_guid_unique" ON "articles" USING btree ("outlet_id","feed_guid");