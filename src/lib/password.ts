import "server-only";
import bcrypt from "bcryptjs";

// Kept separate from lib/auth.ts: bcryptjs uses Node APIs that aren't
// available in the Edge runtime, and auth.ts (JWT verification) is imported
// by middleware.ts, which runs on the Edge.

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
