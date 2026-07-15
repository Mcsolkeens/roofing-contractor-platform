/**
 * Data access for RoofPitch.
 *
 * Two interchangeable implementations behind the same interfaces:
 *   - InMemory*  : no database, resets on restart. Great for local UI testing
 *                  and the v0 preview.
 *   - Db*        : Amazon Aurora PostgreSQL (or any Postgres via DATABASE_URL).
 *
 * Pick with DATA_DRIVER = "aurora" | "memory" (defaults to "memory" when no
 * database is configured). The workflow and API routes only ever see the
 * interfaces, so switching drivers changes nothing else.
 */

import { query } from "@/lib/db"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ContractorStatus = "pending" | "approved" | "rejected"

export interface Contractor {
  id: string
  company: string
  contactName: string
  email: string
  phone?: string
  serviceArea?: string
  postalPrefix?: string
  specialties: string[]
  status: ContractorStatus
  createdAt: string
}

export interface ContractorInput {
  company: string
  contactName: string
  email: string
  phone?: string
  serviceArea?: string
  postalPrefix?: string
  specialties: string[]
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
  provider?: string
  contractorIds: string[]
  reportUrl?: string
  materialsUrl?: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Interfaces                                                          */
/* ------------------------------------------------------------------ */

export interface ContractorRepository {
  create(input: ContractorInput): Promise<Contractor>
  listByStatus(status: ContractorStatus | "all"): Promise<Contractor[]>
  getById(id: string): Promise<Contractor | undefined>
  setStatus(id: string, status: ContractorStatus): Promise<Contractor>
  findNearest(postalCode: string, limit: number): Promise<Contractor[]>
  findByIds(ids: string[]): Promise<Contractor[]>
}

export interface MeasurementRequestRepository {
  create(
    input: Omit<MeasurementRequest, "id" | "createdAt" | "status" | "contractorIds">,
  ): Promise<MeasurementRequest>
  update(id: string, patch: Partial<MeasurementRequest>): Promise<MeasurementRequest>
  setMatches(id: string, contractorIds: string[]): Promise<void>
  findById(id: string): Promise<MeasurementRequest | undefined>
  findByJobId(jobId: string): Promise<MeasurementRequest | undefined>
  listRecent(limit: number): Promise<MeasurementRequest[]>
  /** Requests whose measurement was ordered but is not yet finished. */
  listInProgress(): Promise<MeasurementRequest[]>
}

/**
 * Normalized Forward Sortation Area — the first 3 chars of a Canadian postal
 * code (e.g. "P3E 2C6" -> "P3E"). The FSA identifies a specific geographic area.
 */
export function normalizeFsa(postal: string): string {
  return postal.replace(/\s+/g, "").toUpperCase().slice(0, 3)
}

/**
 * Metro/city "area key" = the letter+digit portion of the FSA (e.g. "P3" =
 * Greater Sudbury, "M5" = downtown Toronto). This is the granularity we match
 * on: precise enough to separate cities, broad enough to cover a whole metro.
 */
function areaKey(postal: string): string {
  return normalizeFsa(postal).slice(0, 2)
}

/* ================================================================== */
/* In-memory implementation                                            */
/* ================================================================== */

const seedContractors: Contractor[] = [
  { id: "c1", company: "Summit Roofing Co.", contactName: "Dave Nguyen", email: "leads@summitroofing.example", phone: "416-555-0110", serviceArea: "Downtown Toronto", postalPrefix: "M5V", specialties: ["shingles", "metal"], status: "approved", createdAt: new Date().toISOString() },
  { id: "c2", company: "Maple Leaf Exteriors", contactName: "Sarah Bianchi", email: "quotes@mapleleaf.example", phone: "416-555-0134", serviceArea: "Downtown Toronto", postalPrefix: "M5H", specialties: ["shingles", "flat"], status: "approved", createdAt: new Date().toISOString() },
  { id: "c3", company: "Northern Peak Roofers", contactName: "Tom Reyes", email: "hello@northernpeak.example", phone: "705-555-0177", serviceArea: "Greater Sudbury", postalPrefix: "P3A", specialties: ["metal"], status: "pending", createdAt: new Date().toISOString() },
  { id: "c4", company: "TrueLine Roofing", contactName: "Priya Shah", email: "office@trueline.example", phone: "905-555-0199", serviceArea: "Mississauga, Oakville", postalPrefix: "L5B", specialties: ["shingles", "flat", "metal"], status: "pending", createdAt: new Date().toISOString() },
]

const memContractors: Contractor[] = [...seedContractors]
const memRequests = new Map<string, MeasurementRequest>()

export class InMemoryContractorRepository implements ContractorRepository {
  async create(input: ContractorInput): Promise<Contractor> {
    const contractor: Contractor = {
      id: `c_${Date.now()}`,
      ...input,
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    memContractors.unshift(contractor)
    return contractor
  }

  async listByStatus(status: ContractorStatus | "all"): Promise<Contractor[]> {
    const all = [...memContractors].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return status === "all" ? all : all.filter((c) => c.status === status)
  }

  async getById(id: string): Promise<Contractor | undefined> {
    return memContractors.find((c) => c.id === id)
  }

  async setStatus(id: string, status: ContractorStatus): Promise<Contractor> {
    const c = memContractors.find((x) => x.id === id)
    if (!c) throw new Error(`Contractor ${id} not found`)
    c.status = status
    return c
  }

  async findNearest(postalCode: string, limit: number): Promise<Contractor[]> {
    const area = areaKey(postalCode)
    const fsa = normalizeFsa(postalCode)
    if (area.length < 2) return []
    const approved = memContractors.filter((c) => c.status === "approved")
    // Only contractors serving the same metro area. No broad fallback: an area
    // with no approved company returns nothing (the UI shows "none yet").
    const inArea = approved.filter((c) => areaKey(c.postalPrefix ?? "") === area)
    // Exact FSA matches rank first, then the rest of the metro area.
    inArea.sort((a, b) => {
      const aExact = normalizeFsa(a.postalPrefix ?? "") === fsa ? 0 : 1
      const bExact = normalizeFsa(b.postalPrefix ?? "") === fsa ? 0 : 1
      return aExact - bExact
    })
    return inArea.slice(0, limit)
  }

  async findByIds(ids: string[]): Promise<Contractor[]> {
    return memContractors.filter((c) => ids.includes(c.id))
  }
}

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
    memRequests.set(request.id, request)
    return request
  }

  async update(id: string, patch: Partial<MeasurementRequest>): Promise<MeasurementRequest> {
    const existing = memRequests.get(id)
    if (!existing) throw new Error(`Request ${id} not found`)
    const updated = { ...existing, ...patch }
    memRequests.set(id, updated)
    return updated
  }

  async setMatches(id: string, contractorIds: string[]): Promise<void> {
    const existing = memRequests.get(id)
    if (existing) existing.contractorIds = contractorIds
  }

  async findById(id: string): Promise<MeasurementRequest | undefined> {
    return memRequests.get(id)
  }

  async findByJobId(jobId: string): Promise<MeasurementRequest | undefined> {
    return Array.from(memRequests.values()).find((r) => r.jobId === jobId)
  }

  async listRecent(limit: number): Promise<MeasurementRequest[]> {
    return Array.from(memRequests.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  async listInProgress(): Promise<MeasurementRequest[]> {
    return Array.from(memRequests.values()).filter(
      (r) => r.status === "measurement_ordered" && Boolean(r.jobId),
    )
  }
}

/* ================================================================== */
/* Aurora / Postgres implementation                                    */
/* ================================================================== */

interface ContractorRow {
  id: string
  company: string
  contact_name: string
  email: string
  phone: string | null
  service_area: string | null
  postal_prefix: string | null
  specialties: string[]
  status: ContractorStatus
  created_at: Date
  // Index signature so this satisfies pg's QueryResultRow constraint.
  [key: string]: unknown
}

function mapContractor(r: ContractorRow): Contractor {
  return {
    id: r.id,
    company: r.company,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone ?? undefined,
    serviceArea: r.service_area ?? undefined,
    postalPrefix: r.postal_prefix ?? undefined,
    specialties: r.specialties ?? [],
    status: r.status,
    createdAt: r.created_at.toISOString(),
  }
}

export class DbContractorRepository implements ContractorRepository {
  async create(input: ContractorInput): Promise<Contractor> {
    const { rows } = await query<ContractorRow>(
      `INSERT INTO contractors (company, contact_name, email, phone, service_area, postal_prefix, specialties)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        input.company,
        input.contactName,
        input.email,
        input.phone ?? null,
        input.serviceArea ?? null,
        input.postalPrefix ?? null,
        input.specialties,
      ],
    )
    return mapContractor(rows[0])
  }

  async listByStatus(status: ContractorStatus | "all"): Promise<Contractor[]> {
    const { rows } =
      status === "all"
        ? await query<ContractorRow>(`SELECT * FROM contractors ORDER BY created_at DESC`)
        : await query<ContractorRow>(
            `SELECT * FROM contractors WHERE status = $1 ORDER BY created_at DESC`,
            [status],
          )
    return rows.map(mapContractor)
  }

  async getById(id: string): Promise<Contractor | undefined> {
    const { rows } = await query<ContractorRow>(`SELECT * FROM contractors WHERE id = $1`, [id])
    return rows[0] ? mapContractor(rows[0]) : undefined
  }

  async setStatus(id: string, status: ContractorStatus): Promise<Contractor> {
    const { rows } = await query<ContractorRow>(
      `UPDATE contractors SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, status],
    )
    if (!rows[0]) throw new Error(`Contractor ${id} not found`)
    return mapContractor(rows[0])
  }

  async findNearest(postalCode: string, limit: number): Promise<Contractor[]> {
    const area = areaKey(postalCode) // e.g. "P3"
    const fsa = normalizeFsa(postalCode) // e.g. "P3E"
    if (area.length < 2) return []
    // Only approved contractors whose service area (FSA) is in the same metro
    // area (letter+digit). No broad fallback — an unserved area returns none.
    // Exact FSA matches are ranked first.
    const { rows } = await query<ContractorRow>(
      `SELECT * FROM contractors
       WHERE status = 'approved'
         AND UPPER(LEFT(postal_prefix, 2)) = $1
       ORDER BY (UPPER(LEFT(postal_prefix, 3)) = $2) DESC, created_at DESC
       LIMIT $3`,
      [area, fsa, limit],
    )
    return rows.map(mapContractor)
  }

  async findByIds(ids: string[]): Promise<Contractor[]> {
    if (ids.length === 0) return []
    const { rows } = await query<ContractorRow>(
      `SELECT * FROM contractors WHERE id = ANY($1::uuid[])`,
      [ids],
    )
    return rows.map(mapContractor)
  }
}

interface RequestRow {
  id: string
  address: string
  postal_code: string
  product: string
  color: string | null
  homeowner_email: string | null
  status: RequestStatus
  job_id: string | null
  provider: string | null
  report_url: string | null
  materials_url: string | null
  created_at: Date
  // Index signature so this satisfies pg's QueryResultRow constraint.
  [key: string]: unknown
}

async function mapRequest(r: RequestRow): Promise<MeasurementRequest> {
  const { rows } = await query<{ contractor_id: string }>(
    `SELECT contractor_id FROM request_contractors WHERE request_id = $1`,
    [r.id],
  )
  return {
    id: r.id,
    address: r.address,
    postalCode: r.postal_code,
    product: r.product,
    color: r.color ?? "",
    homeownerEmail: r.homeowner_email ?? undefined,
    status: r.status,
    jobId: r.job_id ?? undefined,
    provider: r.provider ?? undefined,
    contractorIds: rows.map((x) => x.contractor_id),
    reportUrl: r.report_url ?? undefined,
    materialsUrl: r.materials_url ?? undefined,
    createdAt: r.created_at.toISOString(),
  }
}

export class DbMeasurementRequestRepository implements MeasurementRequestRepository {
  async create(
    input: Omit<MeasurementRequest, "id" | "createdAt" | "status" | "contractorIds">,
  ): Promise<MeasurementRequest> {
    const { rows } = await query<RequestRow>(
      `INSERT INTO measurement_requests (address, postal_code, product, color, homeowner_email)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.address, input.postalCode, input.product, input.color, input.homeownerEmail ?? null],
    )
    return mapRequest(rows[0])
  }

  async update(id: string, patch: Partial<MeasurementRequest>): Promise<MeasurementRequest> {
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1
    const col: Record<string, string> = {
      status: "status",
      jobId: "job_id",
      provider: "provider",
      reportUrl: "report_url",
      materialsUrl: "materials_url",
    }
    for (const [key, dbCol] of Object.entries(col)) {
      const v = (patch as Record<string, unknown>)[key]
      if (v !== undefined) {
        fields.push(`${dbCol} = $${i++}`)
        values.push(v)
      }
    }
    if (fields.length === 0) {
      const current = await this.findById(id)
      if (!current) throw new Error(`Request ${id} not found`)
      return current
    }
    values.push(id)
    const { rows } = await query<RequestRow>(
      `UPDATE measurement_requests SET ${fields.join(", ")}, updated_at = now()
       WHERE id = $${i} RETURNING *`,
      values,
    )
    if (!rows[0]) throw new Error(`Request ${id} not found`)
    return mapRequest(rows[0])
  }

  async setMatches(id: string, contractorIds: string[]): Promise<void> {
    for (const cid of contractorIds) {
      await query(
        `INSERT INTO request_contractors (request_id, contractor_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [id, cid],
      )
    }
  }

  async findById(id: string): Promise<MeasurementRequest | undefined> {
    const { rows } = await query<RequestRow>(`SELECT * FROM measurement_requests WHERE id = $1`, [id])
    return rows[0] ? mapRequest(rows[0]) : undefined
  }

  async findByJobId(jobId: string): Promise<MeasurementRequest | undefined> {
    const { rows } = await query<RequestRow>(
      `SELECT * FROM measurement_requests WHERE job_id = $1`,
      [jobId],
    )
    return rows[0] ? mapRequest(rows[0]) : undefined
  }

  async listRecent(limit: number): Promise<MeasurementRequest[]> {
    const { rows } = await query<RequestRow>(
      `SELECT * FROM measurement_requests ORDER BY created_at DESC LIMIT $1`,
      [limit],
    )
    return Promise.all(rows.map(mapRequest))
  }

  async listInProgress(): Promise<MeasurementRequest[]> {
    const { rows } = await query<RequestRow>(
      `SELECT * FROM measurement_requests
       WHERE status = 'measurement_ordered' AND job_id IS NOT NULL
       ORDER BY created_at ASC`,
    )
    return Promise.all(rows.map(mapRequest))
  }
}

/* ------------------------------------------------------------------ */
/* Factories                                                           */
/* ------------------------------------------------------------------ */

function useAurora(): boolean {
  const driver = (process.env.DATA_DRIVER || "").toLowerCase()
  if (driver === "aurora" || driver === "db" || driver === "postgres") return true
  if (driver === "memory") return false
  // Auto mode: only talk to a database when an explicit connection string is set.
  // We deliberately do NOT switch to Aurora just because PGHOST exists (the
  // Aurora integration always injects PGHOST), because Aurora IAM auth cannot
  // complete inside the v0 preview sandbox and would 500 every DB call. To use
  // Aurora in the cloud, set DATA_DRIVER=aurora on the Vercel project.
  return Boolean(process.env.DATABASE_URL)
}

export function getContractorRepository(): ContractorRepository {
  return useAurora() ? new DbContractorRepository() : new InMemoryContractorRepository()
}

export function getMeasurementRequestRepository(): MeasurementRequestRepository {
  return useAurora() ? new DbMeasurementRequestRepository() : new InMemoryMeasurementRequestRepository()
}
