import { Pool, type PoolClient } from "pg"

/**
 * Database connection.
 *
 * Supports two connection modes so the same code runs locally and in the cloud:
 *
 *   1. DATABASE_URL set        -> plain password/SSL connection (local Docker
 *                                 Postgres, or any hosted Postgres).
 *   2. Aurora IAM (no URL)     -> short-lived IAM auth token via the RDS Signer
 *                                 and the project's Vercel OIDC role. This is how
 *                                 production talks to Amazon Aurora PostgreSQL.
 *
 * The pool is created lazily so importing this module never opens a connection
 * (the app can boot with DATA_DRIVER=memory and no database at all).
 */

let poolPromise: Promise<Pool> | null = null

async function createPool(): Promise<Pool> {
  // Mode 1: explicit connection string (local dev / any hosted Postgres).
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
      max: 10,
    })
  }

  // Mode 2: Amazon Aurora PostgreSQL with IAM authentication.
  const { Signer } = await import("@aws-sdk/rds-signer")
  const { awsCredentialsProvider } = await import("@vercel/functions/oidc")
  const { attachDatabasePool } = await import("@vercel/functions")

  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION },
    }),
    region: process.env.AWS_REGION,
    hostname: process.env.PGHOST!,
    username: process.env.PGUSER || "postgres",
    port: 5432,
  })

  const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || "postgres",
    port: 5432,
    user: process.env.PGUSER || "postgres",
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 20,
  })
  attachDatabasePool(pool)
  return pool
}

function getPool(): Promise<Pool> {
  if (!poolPromise) poolPromise = createPool()
  return poolPromise
}

/** Single-statement query helper. */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) {
  const pool = await getPool()
  return pool.query<T>(text, params)
}

/** Quick connectivity probe used by the admin status endpoint. */
export async function pingDatabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    await query("SELECT 1")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

/** Use for multi-statement transactions that need one dedicated connection. */
export async function withConnection<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = await getPool()
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
