import type { Contractor } from "@/lib/workflow/repository"

export interface PublicContractor {
  id: string
  company: string
  serviceArea: string
  province: string
  specialties: string[]
  roofWork: string[]
  roofTypes: string[]
  description: string
  yearEstablished: number | null
  logoUrl: string | null
  website: string | null
  properties: string[]
  availability: string
  warranty: string
  cleanup: string
  verifiedBusiness: boolean
  verifiedIko: boolean
  verifiedBp: boolean
  verifiedInsurance: boolean
  verifiedWsib: boolean
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export function sanitizeWebsite(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null
  } catch {
    return null
  }
}

export function toPublicContractor(contractor: Contractor): PublicContractor {
  const onboarding = contractor.onboarding ?? {}
  return {
    id: contractor.id,
    company: contractor.company,
    serviceArea: contractor.serviceArea ?? "",
    province: typeof onboarding.province === "string" ? onboarding.province : "Ontario",
    specialties: contractor.specialties,
    roofWork: readStringList(onboarding.roofWork),
    roofTypes: readStringList(onboarding.roofTypes),
    description: contractor.description ?? "",
    yearEstablished: contractor.yearEstablished ?? null,
    logoUrl: contractor.logoUrl ?? null,
    website: sanitizeWebsite(contractor.website),
    properties: readStringList(onboarding.properties),
    availability: typeof onboarding.availability === "string" ? onboarding.availability : "",
    warranty: typeof onboarding.warranty === "string" ? onboarding.warranty : "",
    cleanup: typeof onboarding.cleanup === "string" ? onboarding.cleanup : "",
    verifiedBusiness: contractor.verifiedBusiness,
    verifiedIko: contractor.verifiedIko,
    verifiedBp: contractor.verifiedBp,
    verifiedInsurance: contractor.verifiedInsurance,
    verifiedWsib: contractor.verifiedWsib,
  }
}
