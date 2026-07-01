import { NextResponse } from "next/server"
import { startMeasurementRequest } from "@/lib/workflow/measurement-workflow"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postalCode, product, color, address, homeownerEmail } = body ?? {}

    if (!postalCode || !product) {
      return NextResponse.json({ error: "postalCode and product are required" }, { status: 400 })
    }

    const result = await startMeasurementRequest({
      address: address ?? postalCode,
      postalCode,
      product,
      color: color ?? "",
      homeownerEmail,
    })

    return NextResponse.json(result, { status: 202 })
  } catch (err) {
    console.log("[v0] [api/measurement] error:", (err as Error).message)
    return NextResponse.json({ error: "Could not start measurement request" }, { status: 500 })
  }
}
