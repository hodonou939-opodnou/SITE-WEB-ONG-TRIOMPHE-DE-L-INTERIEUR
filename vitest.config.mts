import { defineConfig } from "vitest/config";
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
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
