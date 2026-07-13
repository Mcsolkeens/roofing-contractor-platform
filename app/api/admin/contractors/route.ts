import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { getRecentEmails } from "@/lib/providers/email"
import {
  getContractorRepository,
  getMeasurementRequestRepository,
  type ContractorStatus,
} from "@/lib/workflow/repository"

/** List contractor applications (optionally filtered) plus recent requests + emails. */
export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const url = new URL(req.url)
  const status = (url.searchParams.get("status") ?? "all") as ContractorStatus | "all"

  const contractors = await getContractorRepository().listByStatus(status)
  const requests = await getMeasurementRequestRepository().listRecent(20)
  const emails = getRecentEmails(50)

  return NextResponse.json({ contractors, requests, emails })
}
