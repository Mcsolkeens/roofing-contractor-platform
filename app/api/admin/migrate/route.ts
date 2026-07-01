import { NextResponse } from "next/server"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { query } from "@/lib/db"

/**
 * Runs every SQL file in /scripts in order. Guarded by MIGRATE_TOKEN so it
 * can't be triggered publicly. Safe to run repeatedly — the scripts use
 * IF NOT EXISTS / ON CONFLICT.
 *
 *   curl -X POST localhost:3000/api/admin/migrate -H "x-migrate-token: <token>"
 */
export async function POST(req: Request) {
  const token = process.env.MIGRATE_TOKEN ?? "dev-migrate"
  if (req.headers.get("x-migrate-token") !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const dir = path.join(process.cwd(), "scripts")
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()
  const ran: string[] = []

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8")
    await query(sql)
    ran.push(file)
  }

  return NextResponse.json({ ok: true, ran })
}
