import { NextResponse } from "next/server"
import { startMeasurementRequest } from "@/lib/workflow/measurement-workflow"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postalCode, product, color, address, homeownerEmail, contractorIds } = body ?? {}

    if (!postalCode || !product) {
      return NextResponse.json({ error: "postalCode and product are required" }, { status: 400 })
    }

    await startMeasurementRequest({
      address: address ?? postalCode,
      postalCode,
      product,
      color: color ?? "",
      homeownerEmail,
      contractorIds: Array.isArray(contractorIds) ? contractorIds : undefined,
    })

    // Deliberately do NOT return report/materials URLs. The roof report is an
    // internal document emailed to the RoofPitch admin; the homeowner only ever
    // sees a confirmation that their request was received.
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (err) {
    console.log("[v0] [api/measurement] error:", (err as Error).message)
    return NextResponse.json({ error: "Could not start measurement request" }, { status: 500 })
  }
}
