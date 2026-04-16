CREATE TABLE "community_preset" (
	"id" text PRIMARY KEY NOT NULL,
	"saved_preset_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"preset_code" text NOT NULL,
	"base" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_preset_saved_preset_id_unique" UNIQUE("saved_preset_id")
);
--> statement-breakpoint
CREATE TABLE "community_preset_tag" (
	"community_preset_id" text NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "community_preset_tag_community_preset_id_tag_pk" PRIMARY KEY("community_preset_id","tag")
);
--> statement-breakpoint
CREATE TABLE "preset_like" (
	"user_id" text NOT NULL,
	"community_preset_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preset_like_user_id_community_preset_id_pk" PRIMARY KEY("user_id","community_preset_id")
);
--> statement-breakpoint
ALTER TABLE "community_preset" ADD CONSTRAINT "community_preset_saved_preset_id_saved_preset_id_fk" FOREIGN KEY ("saved_preset_id") REFERENCES "public"."saved_preset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_preset" ADD CONSTRAINT "community_preset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_preset_tag" ADD CONSTRAINT "community_preset_tag_community_preset_id_community_preset_id_fk" FOREIGN KEY ("community_preset_id") REFERENCES "public"."community_preset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_like" ADD CONSTRAINT "preset_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_like" ADD CONSTRAINT "preset_like_community_preset_id_community_preset_id_fk" FOREIGN KEY ("community_preset_id") REFERENCES "public"."community_preset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_preset_userId_idx" ON "community_preset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_preset_publishedAt_idx" ON "community_preset" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "community_preset_likeCount_idx" ON "community_preset" USING btree ("like_count");--> statement-breakpoint
CREATE INDEX "community_preset_tag_tag_idx" ON "community_preset_tag" USING btree ("tag");