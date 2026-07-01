/**
 * Measurement provider abstraction.
 *
 * The rest of the app only ever talks to the `MeasurementProvider` interface via
 * `getMeasurementProvider()`. It never imports EagleView (or any concrete provider)
 * directly. To swap providers, add a class that implements `MeasurementProvider`
 * and wire it into the factory at the bottom of this file — nothing else changes.
 */

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

export interface MeasurementProvider {
  readonly name: string
  createJob(address: string): Promise<MeasurementJob>
  getStatus(jobId: string): Promise<MeasurementJobStatus>
  downloadReport(jobId: string): Promise<ReportFile>
  downloadMaterials(jobId: string): Promise<ReportFile>
}

/* ------------------------------------------------------------------ */
/* EagleView — real provider (used in production)                      */
/* ------------------------------------------------------------------ */

export class EagleViewProvider implements MeasurementProvider {
  readonly name = "eagleview"
  private readonly baseUrl = process.env.EAGLEVIEW_API_BASE ?? "https://api.eagleview.com"
  private readonly timeoutMs = Number(process.env.EAGLEVIEW_TIMEOUT_MS ?? 20000)
  // Cache an OAuth token in memory so we don't re-authenticate on every call.
  private token: { value: string; expiresAt: number } | null = null

  /**
   * Returns an Authorization value. Two supported modes:
   *   - Static API key:  EAGLEVIEW_API_KEY               -> Bearer <key>
   *   - OAuth2 client credentials: EAGLEVIEW_CLIENT_ID + EAGLEVIEW_CLIENT_SECRET
   *     -> exchanged for a short-lived bearer token, cached until it expires.
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

    const tokenUrl = process.env.EAGLEVIEW_TOKEN_URL ?? `${this.baseUrl}/oauth2/token`
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    if (!res.ok) throw new Error(`EagleView token request failed (${res.status})`)
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

  private mapStatus(raw: string): MeasurementStatus {
    switch ((raw || "").toLowerCase()) {
      case "complete":
      case "completed":
      case "ready":
        return "ready"
      case "processing":
      case "in_progress":
        return "in_progress"
      case "failed":
      case "error":
        return "failed"
      default:
        return "pending"
    }
  }

  async createJob(address: string): Promise<MeasurementJob> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/v2/measurement-orders`, {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify({ address, productType: "residential-roof" }),
    })
    if (!res.ok) throw new Error(`EagleView createJob failed (${res.status})`)
    const data = (await res.json()) as { orderId: string | number; status?: string }
    return {
      id: String(data.orderId),
      provider: this.name,
      status: this.mapStatus(data.status ?? "pending"),
      address,
      createdAt: new Date().toISOString(),
    }
  }

  async getStatus(jobId: string): Promise<MeasurementJobStatus> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/v2/measurement-orders/${jobId}`, {
      headers: await this.headers(),
    })
    if (!res.ok) throw new Error(`EagleView getStatus failed (${res.status})`)
    const data = (await res.json()) as { status?: string; message?: string }
    return { id: jobId, status: this.mapStatus(data.status ?? "pending"), message: data.message }
  }

  private async download(jobId: string, kind: "report" | "materials"): Promise<ReportFile> {
    const path = kind === "report" ? "report" : "materials-list"
    const res = await this.fetchWithTimeout(`${this.baseUrl}/v2/measurement-orders/${jobId}/${path}`, {
      headers: { ...(await this.headers()), Accept: "application/pdf" },
    })
    if (!res.ok) throw new Error(`EagleView download ${kind} failed (${res.status})`)
    const buf = Buffer.from(await res.arrayBuffer())
    return {
      filename: kind === "report" ? `roof-measurement-${jobId}.pdf` : `materials-list-${jobId}.pdf`,
      contentType: "application/pdf",
      base64: buf.toString("base64"),
    }
  }

  downloadReport(jobId: string) {
    return this.download(jobId, "report")
  }
  downloadMaterials(jobId: string) {
    return this.download(jobId, "materials")
  }
}

/* ------------------------------------------------------------------ */
/* Mock — local development provider (no API key needed)               */
/* ------------------------------------------------------------------ */

function placeholderPdf(title: string): ReportFile {
  const body = `%PDF-1.1 placeholder — ${title} generated locally by the mock provider`
  return {
    filename: `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
    contentType: "application/pdf",
    base64: Buffer.from(body).toString("base64"),
  }
}

export class MockMeasurementProvider implements MeasurementProvider {
  readonly name = "mock"

  async createJob(address: string): Promise<MeasurementJob> {
    return {
      id: `mock_${Date.now()}`,
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

  async downloadReport(): Promise<ReportFile> {
    return placeholderPdf("Roof Measurement Report")
  }
  async downloadMaterials(): Promise<ReportFile> {
    return placeholderPdf("Materials List")
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
