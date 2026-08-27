import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 dropped the `url`/`directUrl` datasource fields from
// schema.prisma in favor of driver adapters at runtime. The app connects
// through Supabase's pooled DATABASE_URL (pgbouncer); migrations use the
// direct DIRECT_URL instead — see prisma.config.ts.
//
// Bounded timeouts, not just error handling: a caller (e.g.
// app/api/cigibm-register/route.ts's Participant write) can catch a
// *rejected* query, but a truly wedged connection neither resolves nor
// rejects — it hangs forever, which no try/catch protects against. These
// three settings give every query on this pool a hard ceiling instead of an
// unbounded wait: connectionTimeoutMillis bounds acquiring a connection from
// the pool, statement_timeout is enforced server-side by Postgres (clean
// cancellation, returns an error), and query_timeout is a client-side
// backstop for the case where even the server's own cancellation can't get
// a response back across a broken connection. Values are deliberately
// generous — not tuned for snappy failure — because vitest.config.mts
// documents that this same pool's cold start against Supabase's pooler can
// already approach/exceed 5s under parallel test-file load; these timeouts
// exist to turn "hangs forever" into "fails after single-digit seconds",
// not to police normal latency.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 8_000,
  query_timeout: 10_000,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
