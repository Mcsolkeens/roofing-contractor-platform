import { NextResponse } from "next/server"
import { startMeasurementRequest } from "@/lib/workflow/measurement-workflow"
import { getMeasurementRequestRepository } from "@/lib/workflow/repository"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postalCode, product, color, address, homeownerEmail, contractorIds } = body ?? {}

    if (!postalCode || !product) {
      return NextResponse.json({ error: "postalCode and product are required" }, { status: 400 })
    }

    const result = await startMeasurementRequest({
      address: address ?? postalCode,
      postalCode,
      product,
      color: color ?? "",
      homeownerEmail,
      contractorIds: Array.isArray(contractorIds) ? contractorIds : undefined,
    })

    // The mock provider finishes instantly, so the report is usually ready by
    // now. Return its current state (incl. download URLs) to the homeowner.
    const repo = getMeasurementRequestRepository()
    const saved = await repo.findById(result.requestId)

    return NextResponse.json(
      {
        ...result,
        status: saved?.status ?? "measurement_ordered",
        reportUrl: saved?.reportUrl,
        materialsUrl: saved?.materialsUrl,
      },
      { status: 202 },
    )
  } catch (err) {
    console.log("[v0] [api/measurement] error:", (err as Error).message)
    return NextResponse.json({ error: "Could not start measurement request" }, { status: 500 })
  }
}
