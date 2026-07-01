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

export function getStorageProvider(): StorageProvider {
  const name = process.env.STORAGE_PROVIDER ?? "memory"
  switch (name) {
    case "s3":
      return new S3StorageProvider()
    case "memory":
      return new MemoryStorageProvider()
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: "${name}"`)
  }
}
