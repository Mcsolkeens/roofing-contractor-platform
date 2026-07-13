import { readMemoryObject, readDbObject } from "@/lib/providers/storage"

export const runtime = "nodejs"

/** Serves stored report/materials PDFs (memory store in dev, database in prod). */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const decoded = decodeURIComponent(key)
  // Try the in-process store first (dev / same-invocation), then the database.
  let object = readMemoryObject(decoded)
  if (!object) {
    try {
      object = await readDbObject(decoded)
    } catch (err) {
      console.log("[v0] [api/reports] db read failed:", (err as Error).message)
    }
  }
  if (!object) {
    return new Response("Not found", { status: 404 })
  }
  const bytes = Buffer.from(object.base64, "base64")
  return new Response(bytes, {
    headers: {
      "Content-Type": object.contentType,
      "Content-Disposition": `inline; filename="${decoded.split("/").pop() ?? "report.pdf"}"`,
    },
  })
}
