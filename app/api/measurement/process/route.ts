import { NextResponse } from "next/server"
import { processMeasurementJob } from "@/lib/workflow/measurement-workflow"

export const runtime = "nodejs"

/**
 * Represents the background worker step. In production a queue or cron job calls
 * this when a measurement report is expected to be ready. Kept as an endpoint so
 * the flow is easy to trigger and test locally.
 */
export async function POST(request: Request) {
  try {
    const { jobId } = await request.json()
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }
    const result = await processMeasurementJob(jobId)
    return NextResponse.json(result)
  } catch (err) {
    console.log("[v0] [api/measurement/process] error:", (err as Error).message)
    return NextResponse.json({ error: "Could not process measurement job" }, { status: 500 })
  }
}
