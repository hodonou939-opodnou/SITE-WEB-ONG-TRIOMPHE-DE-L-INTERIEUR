import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 dropped the `url`/`directUrl` datasource fields from
// schema.prisma in favor of driver adapters at runtime. The app connects
// through Supabase's pooled DATABASE_URL (pgbouncer); migrations use the
// direct DIRECT_URL instead — see prisma.config.ts.
const adapter = new PrismaPg(process.env.DATABASE_URL!);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
