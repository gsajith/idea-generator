CREATE TABLE "tick_lease" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"holder" uuid NOT NULL,
	"locked_until" timestamp with time zone NOT NULL,
	CONSTRAINT "tick_lease_single_row" CHECK ("tick_lease"."id" = 1)
);
