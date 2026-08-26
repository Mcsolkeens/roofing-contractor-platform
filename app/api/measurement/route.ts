import { NextResponse } from "next/server"
import { startMeasurementRequest } from "@/lib/workflow/measurement-workflow"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postalCode, product, color, address, homeownerEmail, contractorIds, scopes } =
      body ?? {}

    if (!postalCode || !product) {
      return NextResponse.json({ error: "postalCode and product are required" }, { status: 400 })
    }

    // `scopes` decides which EagleView report + add-ons get ordered. Trust only
    // the ids we recognise; normalizeScopes() runs inside the workflow/provider.
    const rawScopes = Array.isArray(scopes) ? scopes.filter((s) => typeof s === "string") : []
    if (rawScopes.length === 0) {
      return NextResponse.json({ error: "at least one scope is required" }, { status: 400 })
    }

    await startMeasurementRequest({
      address: address ?? postalCode,
      postalCode,
      product,
      color: color ?? "",
      scopes: rawScopes,
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
