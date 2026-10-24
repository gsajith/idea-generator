CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"thread_root_id" uuid NOT NULL,
	"parent_id" uuid,
	"author" text NOT NULL,
	"url" text NOT NULL,
	"thread_title" text NOT NULL,
	"text" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	CONSTRAINT "signals_source_external_id" UNIQUE("source_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "source_state" (
	"source_id" text PRIMARY KEY NOT NULL,
	"last_fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_thread_root_id_signals_id_fk" FOREIGN KEY ("thread_root_id") REFERENCES "public"."signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_parent_id_signals_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."signals"("id") ON DELETE no action ON UPDATE no action;