CREATE TABLE "distill_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"step" text NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "model_spend" (
	"day" date PRIMARY KEY NOT NULL,
	"usd" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signals" ADD COLUMN "distill_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "signals" ADD COLUMN "drop_reason" text;