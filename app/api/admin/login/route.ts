import { NextResponse } from "next/server"
import { verifyPassword, createSession, destroySession } from "@/lib/admin-auth"

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string }
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }
  await createSession()
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await destroySession()
  return NextResponse.json({ ok: true })
}
