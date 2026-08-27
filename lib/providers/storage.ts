/**
 * Storage provider abstraction (for report/materials PDFs).
 *
 * The workflow stores documents through the `StorageProvider` interface via
 * `getStorageProvider()`. Swap the in-memory dev store for S3 / Vercel Blob by
 * adding a class and a factory case.
 */

export interface StoredObject {
  key: string
  url: string
}

export interface StorageProvider {
  readonly name: string
  put(key: string, file: { base64: string; contentType: string }): Promise<StoredObject>
  getUrl(key: string): Promise<string>
}

/* ------------------------------------------------------------------ */
/* In-memory — local development store                                 */
/* ------------------------------------------------------------------ */

const memoryStore = new Map<string, { base64: string; contentType: string }>()

export class MemoryStorageProvider implements StorageProvider {
  readonly name = "memory"

  async put(key: string, file: { base64: string; contentType: string }): Promise<StoredObject> {
    memoryStore.set(key, file)
    return { key, url: `/api/reports/${encodeURIComponent(key)}` }
  }

  async getUrl(key: string): Promise<string> {
    return `/api/reports/${encodeURIComponent(key)}`
  }
}

export function readMemoryObject(key: string) {
  return memoryStore.get(key)
}

/* ------------------------------------------------------------------ */
/* Database — production store (Amazon Aurora PostgreSQL)              */
/* ------------------------------------------------------------------ */
/**
 * Persists PDFs as rows in a `report_files` table so they survive across
 * serverless invocations. This is the production default when DATA_DRIVER=aurora.
 * PDFs are small (a few KB for mock, a few MB for real EagleView reports), so a
 * BYTEA column is a simple, dependency-free store. Swap for S3/Blob if files
 * grow large.
 */
export class DbStorageProvider implements StorageProvider {
  readonly name = "db"

  async put(key: string, file: { base64: string; contentType: string }): Promise<StoredObject> {
    const { query } = await import("@/lib/db")
    await query(
      `INSERT INTO report_files (key, content_type, bytes, created_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE SET content_type = EXCLUDED.content_type, bytes = EXCLUDED.bytes`,
      [key, file.contentType, Buffer.from(file.base64, "base64")],
    )
    return { key, url: `/api/reports/${encodeURIComponent(key)}` }
  }

  async getUrl(key: string): Promise<string> {
    return `/api/reports/${encodeURIComponent(key)}`
  }
}

/** Reads a stored PDF from the database (used by the reports route). */
export async function readDbObject(key: string): Promise<{ base64: string; contentType: string } | undefined> {
  const { query } = await import("@/lib/db")
  const res = await query<{ content_type: string; bytes: Buffer }>(
    `SELECT content_type, bytes FROM report_files WHERE key = $1`,
    [key],
  )
  const row = res.rows[0]
  if (!row) return undefined
  return { base64: Buffer.from(row.bytes).toString("base64"), contentType: row.content_type }
}

/* ------------------------------------------------------------------ */
/* S3 — real provider                                                  */
/* ------------------------------------------------------------------ */
/**
 * Production S3 uploads need SigV4 request signing, so this provider expects the
 * AWS SDK (`@aws-sdk/client-s3`). Install it, then implement `put`/`getUrl` here.
 * Everything else in the app stays the same because it only depends on the
 * `StorageProvider` interface.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = "s3"

  async put(): Promise<StoredObject> {
    throw new Error("S3StorageProvider not configured. Install @aws-sdk/client-s3 and implement put().")
  }
  async getUrl(): Promise<string> {
    throw new Error("S3StorageProvider not configured.")
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

/**
 * Wraps a primary storage provider so that if a write fails (e.g. Aurora IAM/
 * OIDC not yet trusted by AWS), we transparently fall back to the in-memory
 * store. This keeps the report-generation + email flow working even when the
 * database is unreachable — critically, storing PDFs must never block the
 * RoofPitch notification email, since the email carries the PDFs as attachments
 * (from in-memory buffers) and does not depend on the stored copy.
 */
class FallbackStorageProvider implements StorageProvider {
  readonly name: string
  private unavailable = false
  constructor(
    private primary: StorageProvider,
    private fallback: StorageProvider,
  ) {
    this.name = primary.name
  }

  async put(key: string, file: { base64: string; contentType: string }): Promise<StoredObject> {
    if (this.unavailable) return this.fallback.put(key, file)
    try {
      return await this.primary.put(key, file)
    } catch (err) {
      this.unavailable = true
      console.log(
        `[v0] Storage unavailable (${this.primary.name}): ${(err as Error).message}. Falling back to in-memory store.`,
      )
      return this.fallback.put(key, file)
    }
  }

  async getUrl(key: string): Promise<string> {
    if (this.unavailable) return this.fallback.getUrl(key)
    try {
      return await this.primary.getUrl(key)
    } catch {
      this.unavailable = true
      return this.fallback.getUrl(key)
    }
  }
}

export function getStorageProvider(): StorageProvider {
  // Default: follow the data driver. Aurora deployments persist PDFs in the DB;
  // everything else uses the in-process memory store. STORAGE_PROVIDER overrides.
  const fallback = (process.env.DATA_DRIVER ?? "memory") === "aurora" ? "db" : "memory"
  const name = process.env.STORAGE_PROVIDER ?? fallback
  switch (name) {
    case "s3":
      return new S3StorageProvider()
    case "db":
      // Fall back to in-memory if the database can't be reached, so a DB outage
      // never prevents the RoofPitch report email from being sent.
      return new FallbackStorageProvider(new DbStorageProvider(), new MemoryStorageProvider())
    case "memory":
      return new MemoryStorageProvider()
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: "${name}"`)
  }
}
