import { EagleViewProvider } from "@/lib/providers/measurement"
import { DEFAULT_SANDBOX_REPORT_ID } from "@/lib/eagleview-sandbox"

export const dynamic = "force-dynamic"

/**
 * Streams a real report file from the EagleView sandbox so it can be opened or
 * downloaded directly in the browser during a demo.
 *   /api/eagleview/sandbox-file?reportId=68789287&kind=pdf
 *   /api/eagleview/sandbox-file?reportId=68789287&kind=json
 */
export async function GET(request: Request) {
  if (!process.env.EAGLEVIEW_CLIENT_ID || !process.env.EAGLEVIEW_CLIENT_SECRET) {
    return new Response("EagleView credentials are not configured.", { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const reportId = searchParams.get("reportId") ?? DEFAULT_SANDBOX_REPORT_ID
  const kind = searchParams.get("kind") ?? "pdf"

  const provider = new EagleViewProvider()
  try {
    const file = kind === "json" ? await provider.downloadMaterials(reportId) : await provider.downloadReport(reportId)
    const buf = Buffer.from(file.base64, "base64")
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${file.filename}"`,
      },
    })
  } catch (err) {
    return new Response(`Failed to fetch file: ${(err as Error).message}`, { status: 502 })
  }
}
