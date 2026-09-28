CREATE TYPE "public"."article_kind" AS ENUM('reporting', 'analysis', 'opinion', 'rumor', 'review', 'guide');--> statement-breakpoint
CREATE TYPE "public"."subject_kind" AS ENUM('game', 'company', 'platform', 'storefront', 'subject');--> statement-breakpoint
CREATE TYPE "public"."topic_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "articles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"outlet_id" integer NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"published_date" date NOT NULL,
	"description" text NOT NULL,
	"kind" "article_kind" DEFAULT 'reporting' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outlets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "outlets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"site_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outlets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "outlets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "subject_kind" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topic_articles" (
	"topic_id" integer NOT NULL,
	"article_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "topic_articles_topic_id_article_id_pk" PRIMARY KEY("topic_id","article_id"),
	CONSTRAINT "topic_articles_position_unique" UNIQUE("topic_id","position"),
	CONSTRAINT "topic_articles_position_nonnegative" CHECK ("topic_articles"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "topic_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topic_subjects" (
	"topic_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "topic_subjects_topic_id_subject_id_pk" PRIMARY KEY("topic_id","subject_id"),
	CONSTRAINT "topic_subjects_position_unique" UNIQUE("topic_id","position"),
	CONSTRAINT "topic_subjects_position_nonnegative" CHECK ("topic_subjects"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "topic_subjects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "topics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"event_date" date NOT NULL,
	"description" text NOT NULL,
	"summary" text NOT NULL,
	"status" "topic_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"announcement" jsonb,
	"image" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_articles" ADD CONSTRAINT "topic_articles_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_articles" ADD CONSTRAINT "topic_articles_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_subjects" ADD CONSTRAINT "topic_subjects_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_subjects" ADD CONSTRAINT "topic_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_outlet_idx" ON "articles" USING btree ("outlet_id");--> statement-breakpoint
CREATE INDEX "topic_articles_article_idx" ON "topic_articles" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "topic_subjects_subject_idx" ON "topic_subjects" USING btree ("subject_id","topic_id");--> statement-breakpoint
CREATE INDEX "topics_feed_idx" ON "topics" USING btree ("status","is_sample","event_date" DESC NULLS LAST,"id" DESC NULLS LAST);