import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// This app owns its own isolated Neon database (collab_intel). The Neon
// integration manages DATABASE_URL and points it at the default `neondb`
// database, which belongs to a different app. To avoid a table collision
// (both define a `users` table), the app reads APP_DATABASE_URL when present
// and only falls back to DATABASE_URL for local/tooling use.
const datasourceUrl = process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
