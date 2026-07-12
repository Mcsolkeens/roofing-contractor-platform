import { NextResponse } from "next/server"
import { EagleViewProvider } from "@/lib/providers/measurement"
import { DEFAULT_SANDBOX_REPORT_ID } from "@/lib/eagleview-sandbox"

export const dynamic = "force-dynamic"

interface Step {
  name: string
  ok: boolean
  detail: string
  data?: unknown
}

/**
 * Runs a real, read-only end-to-end call sequence against EagleView's sandbox
 * using the pre-loaded sample data. Each step reports success/failure so the
 * result can be shown live (and demoed to EagleView's integration team).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reportId = searchParams.get("reportId") ?? DEFAULT_SANDBOX_REPORT_ID

  if (!process.env.EAGLEVIEW_CLIENT_ID || !process.env.EAGLEVIEW_CLIENT_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "EagleView sandbox credentials are not set. Add EAGLEVIEW_CLIENT_ID and EAGLEVIEW_CLIENT_SECRET to run the live test.",
      },
      { status: 200 },
    )
  }

  const provider = new EagleViewProvider()
  const steps: Step[] = []

  // 1. Authenticate (OAuth2 client-credentials token exchange).
  try {
    const auth = await provider.verifyAuth()
    steps.push({
      name: "Authenticate (OAuth2 client credentials)",
      ok: true,
      detail: `Access token acquired. Expires in ~${auth.expiresInSec}s.`,
    })
  } catch (err) {
    steps.push({
      name: "Authenticate (OAuth2 client credentials)",
      ok: false,
      detail: (err as Error).message,
    })
    return NextResponse.json({ ok: false, configured: true, reportId, steps }, { status: 200 })
  }

  // 2. Get available products (authorized data call).
  try {
    const products = await provider.getAvailableProducts()
    const count = Array.isArray(products)
      ? products.length
      : Array.isArray((products as { products?: unknown[] })?.products)
        ? (products as { products: unknown[] }).products.length
        : undefined
    steps.push({
      name: "Get available products",
      ok: true,
      detail: count !== undefined ? `Returned ${count} products.` : "Returned product catalog.",
      data: products,
    })
  } catch (err) {
    steps.push({ name: "Get available products", ok: false, detail: (err as Error).message })
  }

  // 3. Get a pre-loaded report (real sandbox measurement data).
  try {
    const report = await provider.getReportDetails(reportId)
    steps.push({
      name: `Get report ${reportId}`,
      ok: true,
      detail: "Retrieved pre-loaded sandbox report data.",
      data: report,
    })
  } catch (err) {
    steps.push({ name: `Get report ${reportId}`, ok: false, detail: (err as Error).message })
  }

  // 4. Download the Roof 3D PDF for that report (real file bytes).
  try {
    const file = await provider.downloadReport(reportId)
    const bytes = Buffer.from(file.base64, "base64").length
    steps.push({
      name: "Download Roof report PDF",
      ok: true,
      detail: `Downloaded ${file.filename} (${(bytes / 1024).toFixed(1)} KB, ${file.contentType}).`,
    })
  } catch (err) {
    steps.push({ name: "Download Roof report PDF", ok: false, detail: (err as Error).message })
  }

  const ok = steps.every((s) => s.ok)
  return NextResponse.json({ ok, configured: true, reportId, steps }, { status: 200 })
}
