import { NextResponse } from "next/server"
import { getContractorRepository, normalizeFsa, type ContractorInput } from "@/lib/workflow/repository"

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

  // Matching is done on the Forward Sortation Area (first 3 chars of a real
  // Canadian postal code). Require a postal code so a company is matched to the
  // right city — deriving it from a free-text city name does not work.
  const fsa = normalizeFsa(body.postalCode ?? body.postalPrefix ?? "")
  if (fsa.length < 2) {
    return NextResponse.json(
      { error: "A valid service-area postal code (e.g. P3A 1B2) is required." },
      { status: 400 },
    )
  }

  // Optional profile details. Keep the logo data URL to a sane size so we don't
  // store multi-MB payloads; the client also caps the file before uploading.
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 1000) : undefined
  const yearEstablished =
    Number.isFinite(Number(body.yearEstablished)) && Number(body.yearEstablished) > 1800
      ? Math.floor(Number(body.yearEstablished))
      : undefined
  const logoUrl =
    typeof body.logoUrl === "string" && body.logoUrl.startsWith("data:image/") && body.logoUrl.length < 1_500_000
      ? body.logoUrl
      : undefined

  const repo = getContractorRepository()
  const contractor = await repo.create({
    company: body.company,
    contactName: body.contactName,
    email: body.email,
    phone: body.phone,
    serviceArea: body.serviceArea,
    postalPrefix: fsa,
    specialties: body.specialties ?? [],
    description,
    yearEstablished,
    logoUrl,
  })

  return NextResponse.json(
    { ok: true, id: contractor.id, status: contractor.status },
    { status: 201 },
  )
}
