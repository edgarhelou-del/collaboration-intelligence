import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// This app owns its own isolated Neon database (collab_intel). The Neon
// integration manages DATABASE_URL and points it at the default `neondb`
// database, which belongs to a different app. Both apps define a `users`
// table, so they cannot share a database.
//
// Rather than depend on a separately-pasted connection string, we derive the
// app's connection from the integration-managed DATABASE_URL by swapping only
// the database name. Credentials, host and pooling stay identical, and this
// works the same locally and on Vercel. Override the target name with
// APP_DB_NAME, or bypass derivation entirely with a full APP_DATABASE_URL.
const APP_DB_NAME = process.env.APP_DB_NAME ?? "collab_intel";

function isPostgresUrl(value: string | undefined): value is string {
  return (
    !!value &&
    (value.startsWith("postgresql://") || value.startsWith("postgres://"))
  );
}

function resolveDatasourceUrl(): string | undefined {
  // 1. An explicit, valid full URL always wins.
  if (isPostgresUrl(process.env.APP_DATABASE_URL)) {
    return process.env.APP_DATABASE_URL;
  }

  // 2. Otherwise derive from the integration-managed URL by swapping the db name.
  const base = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;
  if (!isPostgresUrl(base)) return base;

  try {
    const url = new URL(base);
    url.pathname = `/${APP_DB_NAME}`;
    return url.toString();
  } catch {
    return base;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
