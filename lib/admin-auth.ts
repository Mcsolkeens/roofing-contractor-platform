import { cookies } from "next/headers"
import { createHash } from "node:crypto"

/**
 * Minimal admin auth: a single shared password (ADMIN_PASSWORD) exchanged for
 * an httpOnly cookie holding a hash of that password. Enough to gate the admin
 * dashboard for a small team. Swap for Better Auth / SSO when you add real
 * per-user admin accounts.
 */

const COOKIE = "rp_admin"

function expectedToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "roofpitch-admin"
  return createHash("sha256").update(secret).digest("hex")
}

export function verifyPassword(password: string): boolean {
  return (
    createHash("sha256").update(password).digest("hex") === expectedToken()
  )
}

export async function createSession(): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  return jar.get(COOKIE)?.value === expectedToken()
}
