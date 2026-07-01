import { readMemoryObject } from "@/lib/providers/storage"

export const runtime = "nodejs"

/** Serves PDFs held by the in-memory storage provider during local development. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const decoded = decodeURIComponent(key)
  const object = readMemoryObject(decoded)
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
