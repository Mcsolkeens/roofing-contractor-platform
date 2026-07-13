/**
 * Measurement workflow.
 *
 * This is the orchestration layer the homeowner flow runs through. The website
 * never calls EagleView / Resend / Stripe directly — it calls this workflow,
 * and the workflow talks to whichever providers are configured.
 *
 *   Homeowner submits  ->  startMeasurementRequest()
 *                            1. save the request
 *                            2. find nearby approved contractors
 *                            3. order a measurement (measurement provider)
 *                            4. return immediately (homeowner never waits)
 *
 *   Background worker  ->  processMeasurementJob(jobId)   (cron / queue calls this)
 *                            1. check job status
 *                            2. when ready, download report + materials
 *                            3. store the PDFs (storage provider)
 *                            4. email the matched contractors (email provider)
 *                            5. update the request status
 */

import { getMeasurementProvider, annotateMockJob } from "@/lib/providers/measurement"
import { getEmailProvider } from "@/lib/providers/email"
import { getStorageProvider } from "@/lib/providers/storage"
import {
  getContractorRepository,
  getMeasurementRequestRepository,
  type Contractor,
} from "@/lib/workflow/repository"

export interface StartRequestInput {
  address: string
  postalCode: string
  product: string
  color: string
  homeownerEmail?: string
  /** Optional homeowner-selected contractors; falls back to nearest approved. */
  contractorIds?: string[]
}

export interface StartRequestResult {
  requestId: string
  jobId: string
  matchedContractors: { id: string; name: string }[]
}

export async function startMeasurementRequest(input: StartRequestInput): Promise<StartRequestResult> {
  const measurement = getMeasurementProvider()
  const contractorRepo = getContractorRepository()
  const requestRepo = getMeasurementRequestRepository()

  // 1. Persist the request.
  const request = await requestRepo.create({
    address: input.address,
    postalCode: input.postalCode,
    product: input.product,
    color: input.color,
    homeownerEmail: input.homeownerEmail,
  })

  // 2. Find nearby approved contractors (or use the homeowner's selection).
  const contractors =
    input.contractorIds && input.contractorIds.length
      ? await contractorRepo.findByIds(input.contractorIds)
      : await contractorRepo.findNearest(input.postalCode, 4)

  // 3. Order the measurement (provider-agnostic). Pass structured parts so the
  //    provider (and the mock PDF) can use the postal code.
  const job = await measurement.createJob(input.address, {
    address: input.address,
    city: "",
    state: "",
    zip: input.postalCode,
  })
  annotateMockJob(job.id, {
    address: input.address,
    postalCode: input.postalCode,
    product: input.product,
    color: input.color,
  })

  // 4. Record what we started (job + matched contractors).
  await requestRepo.setMatches(
    request.id,
    contractors.map((c) => c.id),
  )
  await requestRepo.update(request.id, {
    jobId: job.id,
    provider: job.provider,
    status: "measurement_ordered",
  })

  // 5. Try to finish immediately. Mock reports are ready instantly, so the
  //    homeowner flow completes here. Real EagleView jobs are still "in
  //    progress" at this point — processing then no-ops and the cron poller
  //    picks it up later. Never let this fail the submission.
  try {
    await processMeasurementJob(job.id)
  } catch (err) {
    console.log("[v0] [workflow] immediate processing skipped:", (err as Error).message)
  }

  return {
    requestId: request.id,
    jobId: job.id,
    matchedContractors: contractors.map((c) => ({ id: c.id, name: c.company })),
  }
}

export interface ProcessJobResult {
  status: string
  emailed?: number
}

export async function processMeasurementJob(jobId: string): Promise<ProcessJobResult> {
  const measurement = getMeasurementProvider()
  const email = getEmailProvider()
  const storage = getStorageProvider()
  const requestRepo = getMeasurementRequestRepository()
  const contractorRepo = getContractorRepository()

  const request = await requestRepo.findByJobId(jobId)
  if (!request) throw new Error(`No request found for job ${jobId}`)

  // 1. Is the report ready yet?
  const status = await measurement.getStatus(jobId)
  if (status.status !== "ready") {
    if (status.status === "failed") await requestRepo.update(request.id, { status: "failed" })
    return { status: status.status }
  }

  // 2. Download the documents.
  const report = await measurement.downloadReport(jobId)
  const materials = await measurement.downloadMaterials(jobId)

  // 3. Store them.
  const storedReport = await storage.put(`reports/${jobId}/report.pdf`, report)
  const storedMaterials = await storage.put(`reports/${jobId}/materials.pdf`, materials)
  await requestRepo.update(request.id, {
    status: "measurement_ready",
    reportUrl: storedReport.url,
    materialsUrl: storedMaterials.url,
  })

  // 4. Email the matched contractors with the report attached.
  const contractors = await contractorRepo.findByIds(request.contractorIds)
  await Promise.all(contractors.map((c) => notifyContractor(email, c, request.postalCode, report, materials)))

  // 5. Mark done.
  await requestRepo.update(request.id, { status: "contractors_notified" })
  return { status: "ready", emailed: contractors.length }
}

async function notifyContractor(
  email: ReturnType<typeof getEmailProvider>,
  contractor: Contractor,
  postalCode: string,
  report: { filename: string; base64: string; contentType: string },
  materials: { filename: string; base64: string; contentType: string },
) {
  await email.send({
    to: contractor.email,
    subject: `New roofing lead near ${postalCode}`,
    html: `<p>Hi ${contractor.contactName} at ${contractor.company},</p>
      <p>A homeowner near <strong>${postalCode}</strong> asked to hear from you.
      Their roof measurement report and materials list are attached.</p>
      <p>Reply with a quote to get started.</p>`,
    attachments: [
      { filename: report.filename, base64: report.base64, contentType: report.contentType },
      { filename: materials.filename, base64: materials.base64, contentType: materials.contentType },
    ],
  })
}
