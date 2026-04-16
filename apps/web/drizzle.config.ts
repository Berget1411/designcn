import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// Use direct (non-pooler) Neon URL for drizzle-kit CLI operations.
// Falls back to DATABASE_URL if DIRECT_DATABASE_URL is not set.
const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!;

export default defineConfig({
  schema: ["./db/schema.ts", "./db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
