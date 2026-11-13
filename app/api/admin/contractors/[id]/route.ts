import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { getContractorRepository, type ContractorStatus, type ContractorVerification } from "@/lib/workflow/repository"

/** Approve or reject a contractor application. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    status?: ContractorStatus
    verification?: Record<string, unknown>
  }
  const repo = getContractorRepository()

  if (body.verification && typeof body.verification === "object" && !Array.isArray(body.verification)) {
    const allowed = ["verifiedBusiness", "verifiedIko", "verifiedBp", "verifiedInsurance", "verifiedWsib"] as const
    const verification: Partial<ContractorVerification> = {}
    for (const key of allowed) {
      if (typeof body.verification[key] === "boolean") verification[key] = body.verification[key] as boolean
    }
    if (!Object.keys(verification).length || Object.keys(body.verification).some((key) => !allowed.includes(key as (typeof allowed)[number]))) {
      return NextResponse.json({ error: "Invalid verification fields." }, { status: 400 })
    }
    const contractor = await repo.setVerification(id, verification)
    return NextResponse.json({ ok: true, contractor })
  }

  if (body.status !== "approved" && body.status !== "rejected" && body.status !== "pending") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 })
  }

  const contractor = await repo.setStatus(id, body.status)
  return NextResponse.json({ ok: true, contractor })
}
