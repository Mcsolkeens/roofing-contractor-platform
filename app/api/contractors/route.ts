import { NextResponse } from "next/server"
import { getContractorRepository, type ContractorInput } from "@/lib/workflow/repository"

/**
 * Public endpoint: a roofing company applies to be listed.
 * The application is stored with status "pending" for an admin to review.
 */
export async function POST(req: Request) {
  let body: Partial<ContractorInput> & { postalCode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.company || !body.contactName || !body.email) {
    return NextResponse.json(
      { error: "Company, contact name, and email are required." },
      { status: 400 },
    )
  }

  const repo = getContractorRepository()
  const contractor = await repo.create({
    company: body.company,
    contactName: body.contactName,
    email: body.email,
    phone: body.phone,
    serviceArea: body.serviceArea,
    postalPrefix: (body.postalCode ?? body.postalPrefix ?? "").trim().charAt(0).toUpperCase() || undefined,
    specialties: body.specialties ?? [],
  })

  return NextResponse.json(
    { ok: true, id: contractor.id, status: contractor.status },
    { status: 201 },
  )
}
