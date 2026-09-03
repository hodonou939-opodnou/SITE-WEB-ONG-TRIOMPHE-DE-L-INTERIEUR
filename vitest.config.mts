import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { config } from "dotenv";

// Vitest, unlike Next.js, does not auto-load .env.local into process.env.
// lib/db.ts / prisma/seed.ts read DATABASE_URL from process.env directly, so
// tests that touch the real database (lib/db.test.ts) need it loaded here.
config({ path: path.resolve(import.meta.dirname, ".env.local"), quiet: true });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // Vitest gives each test file its own module registry, so lib/db.ts's
    // globalForPrisma memoization doesn't dedupe across files: every
    // DB-touching test file opens its own PrismaPg pool against Supabase's
    // remote pgbouncer endpoint, concurrently. Cold-start warm-up across
    // several such files can exceed the 5s default. Do not lower this back
    // down without addressing that root cause first.
    testTimeout: 20000,
    // Superpowers isolated worktrees live under .worktrees/, nested inside
    // this repo but excluded from git. Vitest's default excludes don't skip
    // arbitrary dot-directories (only node_modules/.git/etc.), so without
    // this a worktree present during a run makes Vitest discover and run a
    // second copy of the whole suite from inside it — both copies then race
    // each other against the same real Supabase database.
    exclude: [...configDefaults.exclude, "**/.worktrees/**", "**/worktrees/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
