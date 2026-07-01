/**
 * Data access for the measurement workflow.
 *
 * These are interfaces plus in-memory implementations so the app runs locally
 * with no database. In Stage 3 we replace the in-memory classes with Aurora
 * Postgres-backed ones — the workflow keeps calling the same interfaces.
 */

export interface Contractor {
  id: string
  name: string
  email: string
  postalPrefix: string // crude "area" key; real matching will geocode
  specialties: string[]
  approved: boolean
}

export type RequestStatus =
  | "created"
  | "measurement_ordered"
  | "measurement_ready"
  | "contractors_notified"
  | "failed"

export interface MeasurementRequest {
  id: string
  address: string
  postalCode: string
  product: string
  color: string
  homeownerEmail?: string
  status: RequestStatus
  jobId?: string
  contractorIds: string[]
  reportUrl?: string
  materialsUrl?: string
  createdAt: string
}

export interface ContractorRepository {
  findNearest(postalCode: string, limit: number): Promise<Contractor[]>
  findByIds(ids: string[]): Promise<Contractor[]>
}

export interface MeasurementRequestRepository {
  create(input: Omit<MeasurementRequest, "id" | "createdAt" | "status" | "contractorIds">): Promise<MeasurementRequest>
  update(id: string, patch: Partial<MeasurementRequest>): Promise<MeasurementRequest>
  findByJobId(jobId: string): Promise<MeasurementRequest | undefined>
}

/* ------------------------------------------------------------------ */
/* In-memory implementations                                           */
/* ------------------------------------------------------------------ */

const sampleContractors: Contractor[] = [
  { id: "c1", name: "Summit Roofing Co.", email: "leads@summitroofing.example", postalPrefix: "M", specialties: ["shingles", "metal"], approved: true },
  { id: "c2", name: "Maple Leaf Exteriors", email: "quotes@mapleleaf.example", postalPrefix: "M", specialties: ["shingles", "flat"], approved: true },
  { id: "c3", name: "Northern Peak Roofers", email: "hello@northernpeak.example", postalPrefix: "M", specialties: ["metal"], approved: true },
  { id: "c4", name: "TrueLine Roofing", email: "office@trueline.example", postalPrefix: "L", specialties: ["shingles", "flat", "metal"], approved: true },
  { id: "c5", name: "Cheap Fast Roofs", email: "n/a@example", postalPrefix: "M", specialties: ["shingles"], approved: false },
]

export class InMemoryContractorRepository implements ContractorRepository {
  async findNearest(postalCode: string, limit: number): Promise<Contractor[]> {
    const prefix = postalCode.trim().charAt(0).toUpperCase()
    const approved = sampleContractors.filter((c) => c.approved)
    // Prefer same-area contractors, then widen to any approved contractor.
    const inArea = approved.filter((c) => c.postalPrefix === prefix)
    const ranked = inArea.length ? [...inArea, ...approved.filter((c) => !inArea.includes(c))] : approved
    return ranked.slice(0, limit)
  }

  async findByIds(ids: string[]): Promise<Contractor[]> {
    return sampleContractors.filter((c) => ids.includes(c.id))
  }
}

const requests = new Map<string, MeasurementRequest>()

export class InMemoryMeasurementRequestRepository implements MeasurementRequestRepository {
  async create(
    input: Omit<MeasurementRequest, "id" | "createdAt" | "status" | "contractorIds">,
  ): Promise<MeasurementRequest> {
    const request: MeasurementRequest = {
      ...input,
      id: `req_${Date.now()}`,
      status: "created",
      contractorIds: [],
      createdAt: new Date().toISOString(),
    }
    requests.set(request.id, request)
    return request
  }

  async update(id: string, patch: Partial<MeasurementRequest>): Promise<MeasurementRequest> {
    const existing = requests.get(id)
    if (!existing) throw new Error(`Request ${id} not found`)
    const updated = { ...existing, ...patch }
    requests.set(id, updated)
    return updated
  }

  async findByJobId(jobId: string): Promise<MeasurementRequest | undefined> {
    return Array.from(requests.values()).find((r) => r.jobId === jobId)
  }
}

/* ------------------------------------------------------------------ */
/* Factories                                                           */
/* ------------------------------------------------------------------ */

export function getContractorRepository(): ContractorRepository {
  return new InMemoryContractorRepository()
}

export function getMeasurementRequestRepository(): MeasurementRequestRepository {
  return new InMemoryMeasurementRequestRepository()
}
