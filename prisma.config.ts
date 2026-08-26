import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma's config loader intentionally does not read .env files itself
// (see https://pris.ly/prisma-config-env-vars), so we load Next.js's
// .env.local explicitly here.
config({ path: ".env.local", quiet: true });

// Prisma 7 moved connection URLs for the CLI (migrate, studio, db push, ...)
// out of schema.prisma and into this config file. Migrations run against
// Supabase's DIRECT connection (bypassing pgbouncer), since pooled
// connections don't reliably support the DDL/advisory-lock operations
// `prisma migrate` needs. The app's runtime PrismaClient (lib/db.ts) still
// uses the pooled DATABASE_URL via a driver adapter — see lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
