import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { getContractorRepository, type ContractorStatus } from "@/lib/workflow/repository"

/** Approve or reject a contractor application. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { status } = (await req.json().catch(() => ({}))) as { status?: ContractorStatus }

  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 })
  }

  const contractor = await getContractorRepository().setStatus(id, status)
  return NextResponse.json({ ok: true, contractor })
}
