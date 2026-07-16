import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { getMeasurementRequestRepository } from "@/lib/workflow/repository"
import { processMeasurementJob } from "@/lib/workflow/measurement-workflow"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Admin-triggered version of the cron poller. Lets an operator advance every
 * in-progress measurement request on demand — useful while testing the async
 * EagleView flow, where the scheduled cron only runs once a day. Same idempotent
 * logic as /api/cron/poll-jobs, but gated behind the admin session instead of
 * the cron secret.
 */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const requestRepo = getMeasurementRequestRepository()
  const pending = await requestRepo.listInProgress()
  const results: { jobId: string; requestId: string; status: string }[] = []

  for (const req of pending) {
    if (!req.jobId) continue
    try {
      const outcome = await processMeasurementJob(req.jobId)
      results.push({ jobId: req.jobId, requestId: req.id, status: outcome.status })
    } catch (err) {
      console.log("[v0] [admin/process-jobs] job failed:", req.jobId, (err as Error).message)
      results.push({ jobId: req.jobId, requestId: req.id, status: "error" })
    }
  }

  return NextResponse.json({ checked: pending.length, results })
}
