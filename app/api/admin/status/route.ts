import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { pingDatabase } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const driver = (process.env.DATA_DRIVER || "auto").toLowerCase()
  const usingAurora = driver === "aurora" || driver === "db" || driver === "postgres"

  // Only probe when a database is expected; memory mode is always "ok".
  const db = usingAurora ? await pingDatabase() : { ok: true }

  return NextResponse.json({
    driver,
    persistent: usingAurora && db.ok,
    dbReachable: db.ok,
    error: db.ok ? undefined : db.error,
  })
}
