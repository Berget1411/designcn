CREATE TABLE "ai_message_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_user_period_unq" UNIQUE("user_id","period_start")
);
--> statement-breakpoint
ALTER TABLE "saved_preset" DROP CONSTRAINT "saved_preset_userId_name_unq";--> statement-breakpoint
ALTER TABLE "ai_message_usage" ADD CONSTRAINT "ai_message_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_userId_idx" ON "ai_message_usage" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "saved_preset" ADD CONSTRAINT "saved_preset_userid_name_unq" UNIQUE("user_id","name");