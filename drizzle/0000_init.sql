CREATE TABLE "builder_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "builder_profile_single_row" CHECK ("builder_profile"."id" = 1)
);
