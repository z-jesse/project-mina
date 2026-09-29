CREATE TABLE "article_votes" (
	"article_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "article_votes_article_id_user_id_pk" PRIMARY KEY("article_id","user_id"),
	CONSTRAINT "article_votes_value_check" CHECK ("article_votes"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "article_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "article_votes" ADD CONSTRAINT "article_votes_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_votes_user_idx" ON "article_votes" USING btree ("user_id");