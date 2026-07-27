/**
 * Measurement provider abstraction.
 *
 * The rest of the app only ever talks to the `MeasurementProvider` interface via
 * `getMeasurementProvider()`. It never imports EagleView (or any concrete provider)
 * directly. To swap providers, add a class that implements `MeasurementProvider`
 * and wire it into the factory at the bottom of this file — nothing else changes.
 */

import { generateReportPdf, generateMaterialsPdf } from "@/lib/mock-report"

export type MeasurementStatus = "pending" | "in_progress" | "ready" | "failed"

export interface MeasurementJob {
  id: string
  provider: string
  status: MeasurementStatus
  address: string
  createdAt: string
}

export interface MeasurementJobStatus {
  id: string
  status: MeasurementStatus
  message?: string
}

/** A downloaded document, carried as base64 so it can be stored or emailed uniformly. */
export interface ReportFile {
  filename: string
  contentType: string
  base64: string
}

/** Structured address parts (EagleView needs these split out). */
export interface EagleViewAddress {
  address: string
  city: string
  state: string
  zip: string
  country?: string
  latitude?: number | null
  longitude?: number | null
}

export interface MeasurementProvider {
  readonly name: string
  createJob(address: string, structured?: EagleViewAddress): Promise<MeasurementJob>
  getStatus(jobId: string): Promise<MeasurementJobStatus>
  downloadReport(jobId: string): Promise<ReportFile>
  downloadMaterials(jobId: string): Promise<ReportFile>
}

/**
 * EagleView's docs show PlaceOrder and GetReport returning an ARRAY that wraps a
 * single object (e.g. `[{ OrderId, ReportIds }]`), but the live sandbox currently
 * returns the bare OBJECT. To be robust against both (and any future flip), always
 * unwrap: if we get an array, take the first element; otherwise use the value as-is.
 */
function firstOf(value: unknown): Record<string, unknown> {
  const v = Array.isArray(value) ? value[0] : value
  return (v ?? {}) as Record<string, unknown>
}

/** Best-effort parse of "123 Main St, City, ST 12345" into EagleView parts. */
function parseAddress(raw: string): EagleViewAddress {
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean)
  const address = parts[0] ?? raw
  const city = parts[1] ?? ""
  const stateZip = (parts[2] ?? "").split(/\s+/).filter(Boolean)
  const state = stateZip[0] ?? ""
  const zip = stateZip[1] ?? ""
  return { address, city, state, zip, country: "US" }
}

/* ------------------------------------------------------------------ */
/* EagleView — real provider (used in production)                      */
/* ------------------------------------------------------------------ */

/**
 * EagleView host per environment. We run against the sandbox until EagleView
 * approves the integration for production, then flip EAGLEVIEW_ENV=production
 * (or set EAGLEVIEW_API_BASE explicitly). The OAuth token host is the same in
 * both environments; only the API host changes.
 */
const EAGLEVIEW_HOSTS = {
  sandbox: "https://sandbox.apicenter.eagleview.com",
  production: "https://apis.eagleview.com",
} as const

export class EagleViewProvider implements MeasurementProvider {
  readonly name = "eagleview"
  // API host for placing/reading orders. Resolution order:
  //   1. EAGLEVIEW_API_BASE (explicit override)
  //   2. EAGLEVIEW_ENV=sandbox|production   (defaults to sandbox)
  private readonly baseUrl =
    process.env.EAGLEVIEW_API_BASE ??
    EAGLEVIEW_HOSTS[(process.env.EAGLEVIEW_ENV as keyof typeof EAGLEVIEW_HOSTS) ?? "sandbox"] ??
    EAGLEVIEW_HOSTS.sandbox
  // OAuth token endpoint. Documented default is the API Center host.
  private readonly tokenUrl = process.env.EAGLEVIEW_TOKEN_URL ?? "https://apicenter.eagleview.com/oauth2/v1/token"
  private readonly timeoutMs = Number(process.env.EAGLEVIEW_TIMEOUT_MS ?? 20000)
  // Cache an OAuth token in memory so we don't re-authenticate on every call.
  private token: { value: string; expiresAt: number } | null = null

  /**
   * Returns an Authorization value. Two supported modes:
   *   - Static API key:  EAGLEVIEW_API_KEY               -> Bearer <key>
   *   - OAuth2 client credentials: EAGLEVIEW_CLIENT_ID + EAGLEVIEW_CLIENT_SECRET
   *     -> exchanged for a short-lived bearer token, cached until it expires.
   *
   * The client-credentials call follows EagleView's documented flow exactly:
   * POST to the token endpoint with HTTP Basic auth (base64(id:secret)) and
   * `grant_type=client_credentials` as a urlencoded body. No scope is sent.
   * See https://developer.eagleview.com/documentation/authentication-methods/v1/client-credentials
   */
  private async authorization(): Promise<string> {
    const staticKey = process.env.EAGLEVIEW_API_KEY
    if (staticKey) return `Bearer ${staticKey}`

    const clientId = process.env.EAGLEVIEW_CLIENT_ID
    const clientSecret = process.env.EAGLEVIEW_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error(
        "EagleView is not configured. Set EAGLEVIEW_API_KEY, or EAGLEVIEW_CLIENT_ID + EAGLEVIEW_CLIENT_SECRET, or switch MEASUREMENT_PROVIDER=mock.",
      )
    }

    if (this.token && this.token.expiresAt > Date.now() + 30_000) {
      return `Bearer ${this.token.value}`
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const res = await this.fetchWithTimeout(this.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new Error(
        `EagleView token request failed (${res.status}). ${detail.slice(0, 300)}`,
      )
    }
    const data = (await res.json()) as { access_token: string; expires_in?: number }
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    }
    return `Bearer ${this.token.value}`
  }

  private async headers(): Promise<Record<string, string>> {
    return { Authorization: await this.authorization(), "Content-Type": "application/json" }
  }

  /** fetch with an abort-based timeout so a hung provider never blocks a request. */
  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  // EagleView returns numeric status codes on a report. These map onto our
  // simplified lifecycle. (3 = complete/available in the Measurement Orders API.)
  private mapStatus(raw: unknown): MeasurementStatus {
    const s = String(raw ?? "").toLowerCase()
    if (["3", "complete", "completed", "ready", "available", "delivered"].includes(s)) return "ready"
    if (["1", "2", "processing", "in_progress", "inprocess", "pending"].includes(s)) return "in_progress"
    if (["failed", "error", "cancelled", "canceled", "rejected"].includes(s)) return "failed"
    return "pending"
  }

  /**
   * Place a measurement order. Maps to EagleView `POST /v2/Order/PlaceOrder`.
   * The returned report id is used as our job id for status + file retrieval.
   *
   * Note: in the sandbox, PlaceOrder only succeeds for EagleView's pre-loaded
   * addresses. `structured` lets callers pass the exact address parts; otherwise
   * we do a best-effort parse of a single-line address string.
   */
  async createJob(address: string, structured?: EagleViewAddress): Promise<MeasurementJob> {
    const addr = structured ?? parseAddress(address)
    const productId = Number(process.env.EAGLEVIEW_PRODUCT_ID ?? 106) // 106 = roof report
    const deliveryProductId = Number(process.env.EAGLEVIEW_DELIVERY_PRODUCT_ID ?? 8)

    // IMPORTANT: EagleView expects OrderReports and ReportAddresses as single
    // OBJECTS, not arrays. Sending arrays makes their gateway reject the request
    // with a misleading HTTP 503 "upstream connect error" (looks like an outage
    // but is actually a malformed-payload rejection). Verified against the sandbox.
    const body = {
      OrderReports: {
        ReportAddresses: {
          Address: addr.address,
          City: addr.city,
          State: addr.state,
          Zip: addr.zip,
          Country: addr.country ?? "US",
          Latitude: addr.latitude ?? null,
          Longitude: addr.longitude ?? null,
          AddressType: 1,
        },
        PrimaryProductId: productId,
        DeliveryProductId: deliveryProductId,
        MeasurementInstructionType: 3,
        ChangesInLast4Years: false,
      },
    }

    const res = await this.fetchWithTimeout(`${this.baseUrl}/v2/Order/PlaceOrder`, {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new Error(`EagleView PlaceOrder failed (${res.status}). ${detail.slice(0, 300)}`)
    }
    // Docs show `[{ OrderId, ReportIds }]`; sandbox returns the bare object.
    // firstOf() handles both.
    const data = firstOf(await res.json())
    // EagleView responds with { OrderId, ReportIds: [<id>] }. Probe that first,
    // then fall back to older/alternate shapes for safety.
    const reportId =
      ((data.ReportIds as Array<string | number> | undefined)?.[0]) ??
      (data.reportId as string | number | undefined) ??
      (data.ReportId as string | number | undefined) ??
      ((data.reports as Array<{ reportId?: string | number }> | undefined)?.[0]?.reportId) ??
      ((data.OrderReports as Array<{ ReportId?: string | number }> | undefined)?.[0]?.ReportId)

    return {
      id: String(reportId ?? ""),
      provider: this.name,
      status: "in_progress",
      address,
      createdAt: new Date().toISOString(),
    }
  }

  /** Report status. Maps to EagleView `GET /v3/Report/GetReport?reportId=`. */
  async getStatus(jobId: string): Promise<MeasurementJobStatus> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/v3/Report/GetReport?reportId=${encodeURIComponent(jobId)}`,
      { headers: await this.headers() },
    )
    if (!res.ok) throw new Error(`EagleView GetReport failed (${res.status})`)
    const data = firstOf(await res.json())
    const statusRaw =
      data.status ?? data.Status ?? data.reportStatus ?? data.ReportStatus ?? data.statusId ?? data.StatusId
    return { id: jobId, status: this.mapStatus(statusRaw) }
  }

  /**
   * Download a report file. Maps to EagleView
   * `GET /v1/File/GetReportFile?fileFormat=&fileType=&reportId=`.
   * The response may be raw bytes or a JSON envelope containing a URL — we
   * handle both.
   */
  private async download(jobId: string, fileFormat: number, fileType: number, filename: string): Promise<ReportFile> {
    const url = `${this.baseUrl}/v1/File/GetReportFile?fileFormat=${fileFormat}&fileType=${fileType}&reportId=${encodeURIComponent(jobId)}`
    const res = await this.fetchWithTimeout(url, { headers: await this.headers() })
    if (!res.ok) throw new Error(`EagleView GetReportFile failed (${res.status})`)

    const contentType = res.headers.get("content-type") ?? "application/octet-stream"
    // If EagleView hands back a JSON envelope with a download URL, follow it.
    if (contentType.includes("application/json")) {
      const j = (await res.json()) as Record<string, unknown>
      const fileUrl = (j.url ?? j.Url ?? j.fileUrl ?? j.FileUrl ?? j.downloadUrl) as string | undefined
      const b64 = (j.fileContents ?? j.FileContents ?? j.data) as string | undefined
      if (b64) return { filename, contentType: "application/pdf", base64: b64 }
      if (fileUrl) {
        const f = await this.fetchWithTimeout(fileUrl, {})
        const buf = Buffer.from(await f.arrayBuffer())
        return { filename, contentType: f.headers.get("content-type") ?? "application/pdf", base64: buf.toString("base64") }
      }
      throw new Error("EagleView GetReportFile returned JSON without a file URL or contents")
    }

    const buf = Buffer.from(await res.arrayBuffer())
    return { filename, contentType, base64: buf.toString("base64") }
  }

  /**
   * The human-readable roof report PDF. EagleView exposes this as a direct
   * download URL in the GetReport payload (`ReportDownloadLink`) rather than via
   * GetReportFile — verified against the sandbox, where GetReportFile file-type
   * codes return images/JSON, not the report PDF.
   */
  async downloadReport(jobId: string): Promise<ReportFile> {
    const details = firstOf(await this.getReportDetails(jobId))
    const link =
      (details.ReportDownloadLink as string | undefined) ??
      (details.reportDownloadLink as string | undefined)
    if (!link) throw new Error("EagleView report has no ReportDownloadLink yet (not ready).")
    const f = await this.fetchWithTimeout(link, {})
    if (!f.ok) throw new Error(`EagleView report PDF download failed (${f.status})`)
    const buf = Buffer.from(await f.arrayBuffer())
    return {
      filename: `roof-report-${jobId}.pdf`,
      contentType: f.headers.get("content-type") ?? "application/pdf",
      base64: buf.toString("base64"),
    }
  }
  // EV Measurement export JSON (fileFormat=18, fileType=107) — structured measurements.
  downloadMaterials(jobId: string) {
    return this.download(jobId, 18, 107, `measurements-${jobId}.json`)
  }

  /* ---- Diagnostic helpers (used by the sandbox demo page) ---- */

  /** Confirms auth works by acquiring a token; returns its remaining lifetime. */
  async verifyAuth(): Promise<{ ok: true; expiresInSec: number }> {
    await this.authorization()
    const expiresInSec = this.token ? Math.max(0, Math.round((this.token.expiresAt - Date.now()) / 1000)) : 0
    return { ok: true, expiresInSec }
  }

  /** GET /v2/Product/GetAvailableProducts — proves an authorized data call. */
  async getAvailableProducts(): Promise<unknown> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/v2/Product/GetAvailableProducts`, {
      headers: await this.headers(),
    })
    if (!res.ok) throw new Error(`EagleView GetAvailableProducts failed (${res.status})`)
    return res.json()
  }

  /** Full GetReport payload for a report id (richer than getStatus). */
  async getReportDetails(reportId: string): Promise<unknown> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/v3/Report/GetReport?reportId=${encodeURIComponent(reportId)}`,
      { headers: await this.headers() },
    )
    if (!res.ok) throw new Error(`EagleView GetReport failed (${res.status})`)
    return res.json()
  }
}

/* ------------------------------------------------------------------ */
/* Mock — local development provider (no API key needed)               */
/* ------------------------------------------------------------------ */

/**
 * Remembers the address behind each mock job so the generated PDFs are
 * consistent for that property. Module-level, which is fine for the mock: it
 * lives as long as the server process (same lifetime as the in-memory repo).
 */
const mockJobs = new Map<string, { address: string; postalCode: string; product?: string; color?: string }>()

export class MockMeasurementProvider implements MeasurementProvider {
  readonly name = "mock"

  async createJob(address: string, structured?: EagleViewAddress): Promise<MeasurementJob> {
    const id = `mock_${Date.now()}_${Math.floor(Math.random() * 1e4)}`
    mockJobs.set(id, { address, postalCode: structured?.zip ?? "" })
    return {
      id,
      provider: this.name,
      status: "in_progress",
      address,
      createdAt: new Date().toISOString(),
    }
  }

  // Mock reports are "ready" immediately so the local workflow runs end to end.
  async getStatus(jobId: string): Promise<MeasurementJobStatus> {
    return { id: jobId, status: "ready" }
  }

  private meta(jobId: string) {
    const m = mockJobs.get(jobId)
    return {
      reportId: jobId,
      address: m?.address ?? "123 Demo Street, Toronto, ON",
      postalCode: m?.postalCode ?? "",
      product: m?.product,
      color: m?.color,
    }
  }

  async downloadReport(jobId: string): Promise<ReportFile> {
    const bytes = await generateReportPdf(this.meta(jobId))
    return {
      filename: `roof-report-${jobId}.pdf`,
      contentType: "application/pdf",
      base64: Buffer.from(bytes).toString("base64"),
    }
  }

  async downloadMaterials(jobId: string): Promise<ReportFile> {
    const bytes = await generateMaterialsPdf(this.meta(jobId))
    return {
      filename: `materials-list-${jobId}.pdf`,
      contentType: "application/pdf",
      base64: Buffer.from(bytes).toString("base64"),
    }
  }
}

/** Lets the workflow enrich a mock job with property details for nicer PDFs. */
export function annotateMockJob(
  jobId: string,
  details: { address?: string; postalCode?: string; product?: string; color?: string },
) {
  const existing = mockJobs.get(jobId)
  if (existing) {
    mockJobs.set(jobId, {
      address: details.address ?? existing.address,
      postalCode: details.postalCode ?? existing.postalCode,
      product: details.product ?? existing.product,
      color: details.color ?? existing.color,
    })
  }
}

/* ------------------------------------------------------------------ */
/* Factory — the only thing the app imports                            */
/* ------------------------------------------------------------------ */

export function getMeasurementProvider(): MeasurementProvider {
  const name = process.env.MEASUREMENT_PROVIDER ?? "mock"
  switch (name) {
    case "eagleview":
      return new EagleViewProvider()
    case "mock":
      return new MockMeasurementProvider()
    default:
      throw new Error(`Unknown MEASUREMENT_PROVIDER: "${name}"`)
  }
}
