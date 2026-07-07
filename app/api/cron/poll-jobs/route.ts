import { NextResponse } from "next/server"
import { getMeasurementRequestRepository } from "@/lib/workflow/repository"
import { processMeasurementJob } from "@/lib/workflow/measurement-workflow"

export const runtime = "nodejs"
// Never cache — this must run fresh on every scheduled invocation.
export const dynamic = "force-dynamic"

/**
 * Scheduled poller. Vercel Cron hits this on a fixed interval (see vercel.json).
 * It finds every measurement request whose report was ordered but is not yet
 * finished, and asks the workflow to advance each one. processMeasurementJob is
 * idempotent: it no-ops while the provider is still working and only finishes
 * (download + store + email) once, on the tick where the report becomes ready.
 *
 * Auth: Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`.
 * We reject anything else so the endpoint can't be triggered by the public.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  // If no secret is configured (e.g. local dev), allow it so you can test.
  if (!secret) return true
  return request.headers.get("authorization") === `Bearer ${secret}`
}

async function runPoll() {
  const requestRepo = getMeasurementRequestRepository()
  const pending = await requestRepo.listInProgress()
  const results: { jobId: string; requestId: string; status: string }[] = []

  for (const req of pending) {
    if (!req.jobId) continue
    try {
      const outcome = await processMeasurementJob(req.jobId)
      results.push({ jobId: req.jobId, requestId: req.id, status: outcome.status })
    } catch (err) {
      console.log("[v0] [cron/poll-jobs] job failed:", req.jobId, (err as Error).message)
      results.push({ jobId: req.jobId, requestId: req.id, status: "error" })
    }
  }

  return { checked: pending.length, results }
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const summary = await runPoll()
  return NextResponse.json(summary)
}

// Allow manual POST triggering too (handy for local testing).
export async function POST(request: Request) {
  return GET(request)
}
