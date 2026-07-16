import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { SCHEMA_SQL, SEED_SQL } from "@/lib/migrate-sql"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Applies the schema and demo seed. Guarded by MIGRATE_TOKEN so it can't be
 * triggered publicly. Safe to run repeatedly — all statements are idempotent.
 *
 *   curl -X POST /api/admin/migrate -H "x-migrate-token: <token>"
 *
 * Pass ?seed=false to run the schema only (skip demo contractors).
 */
export async function POST(req: Request) {
  const token = process.env.MIGRATE_TOKEN ?? "dev-migrate"
  if (req.headers.get("x-migrate-token") !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const withSeed = url.searchParams.get("seed") !== "false"
  const ran: string[] = []

  try {
    await query(SCHEMA_SQL)
    ran.push("schema")
    if (withSeed) {
      await query(SEED_SQL)
      ran.push("seed")
    }
    return NextResponse.json({ ok: true, ran })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("[v0] [migrate] failed:", message)
    return NextResponse.json({ error: "migration_failed", message, ran }, { status: 500 })
  }
}
