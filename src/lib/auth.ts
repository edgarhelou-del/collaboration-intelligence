import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "nodo_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const REMEMBER_ME_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  organizationId: string;
  role: "ORG_ADMIN" | "PARTICIPANT";
};

export async function createSessionToken(payload: SessionPayload, rememberMe = false): Promise<string> {
  const duration = rememberMe ? REMEMBER_ME_DURATION_SECONDS : SESSION_DURATION_SECONDS;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + duration)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.organizationId === "string" &&
      (payload.role === "ORG_ADMIN" || payload.role === "PARTICIPANT")
    ) {
      return {
        userId: payload.userId,
        organizationId: payload.organizationId,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_DURATION_SECONDS, REMEMBER_ME_DURATION_SECONDS };

/**
 * Domain used for a work email, lower-cased. Used both to validate the
 * "create organization" flow and to bind future users to the right tenant.
 */
export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

export function isLikelyCorporateDomain(domain: string): boolean {
  return domain.length > 0 && domain.includes(".") && !FREE_EMAIL_DOMAINS.has(domain);
}
