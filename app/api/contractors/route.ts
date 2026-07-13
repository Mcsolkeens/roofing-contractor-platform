import { NextResponse } from "next/server"
import { getContractorRepository, type ContractorInput } from "@/lib/workflow/repository"

export const runtime = "nodejs"

/**
 * Public endpoint: list approved contractors near a postal code.
 * Used by the homeowner quiz to show real, admin-approved companies.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postalCode = searchParams.get("postalCode") ?? ""
  const limit = Number(searchParams.get("limit") ?? 6)

  const repo = getContractorRepository()
  const contractors = postalCode
    ? await repo.findNearest(postalCode, limit)
    : (await repo.listByStatus("approved")).slice(0, limit)

  // Only expose fields the public page needs (no internal email/phone).
  return NextResponse.json({
    contractors: contractors.map((c) => ({
      id: c.id,
      company: c.company,
      serviceArea: c.serviceArea ?? "",
      specialties: c.specialties,
    })),
  })
}

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
