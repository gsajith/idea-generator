import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local on its own; drizzle-kit needs it loaded by hand.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
