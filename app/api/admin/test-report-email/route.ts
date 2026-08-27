import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { getEmailProvider } from "@/lib/providers/email"
import { generateReportPdf, generateMaterialsPdf } from "@/lib/mock-report"

export const runtime = "nodejs"

/**
 * Self-contained test endpoint. Generates the pre-built mock measurement PDFs
 * and emails them to the RoofPitch admin inbox using the live email provider
 * (Resend in production). It deliberately does NOT use getMeasurementProvider()
 * or read MEASUREMENT_PROVIDER, so production stays on EagleView untouched — this
 * only proves the "report -> RoofPitch inbox" email step works end to end.
 */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const address: string = body?.address ?? "123 Demo Street, Toronto, ON"
    const postalCode: string = body?.postalCode ?? "M5V 2T6"
    const product: string = body?.product ?? "shingles"
    const color: string = body?.color ?? "charcoal"

    const meta = { reportId: `test_${Date.now()}`, address, postalCode, product, color }
    const [reportBytes, materialsBytes] = await Promise.all([
      generateReportPdf(meta),
      generateMaterialsPdf(meta),
    ])

    const to =
      process.env.ROOFPITCH_ADMIN_EMAIL ??
      process.env.ADMIN_NOTIFICATION_EMAIL ??
      "admin@roofpitch.ca"

    const email = getEmailProvider()
    const result = await email.send({
      to,
      subject: `TEST — roof report ready — ${address}`,
      html: `<p><strong>This is a test of the RoofPitch report email.</strong></p>
        <ul>
          <li><strong>Address:</strong> ${address}</li>
          <li><strong>Postal code:</strong> ${postalCode}</li>
          <li><strong>Product / color:</strong> ${product} / ${color}</li>
        </ul>
        <p>The mock roof measurement report and materials list are attached.
        In production these come from EagleView; the email/delivery path is identical.</p>`,
      attachments: [
        {
          filename: `roof-report-${meta.reportId}.pdf`,
          base64: Buffer.from(reportBytes).toString("base64"),
          contentType: "application/pdf",
        },
        {
          filename: `materials-list-${meta.reportId}.pdf`,
          base64: Buffer.from(materialsBytes).toString("base64"),
          contentType: "application/pdf",
        },
      ],
    })

    return NextResponse.json({
      ok: true,
      sentTo: to,
      provider: email.name,
      messageId: result.id,
      delivered: email.name === "resend" ? "Sent via Resend" : "Simulated (no RESEND_API_KEY)",
    })
  } catch (err) {
    console.log("[v0] [test-report-email] error:", (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
