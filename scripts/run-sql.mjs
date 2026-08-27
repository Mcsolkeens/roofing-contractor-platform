// Runs a .sql file against Aurora using the same IAM-auth connection as the app.
// Usage: node --env-file-if-exists=/vercel/share/.env.project scripts/run-sql.mjs scripts/001-setup-schema.sql
import { readFileSync } from "node:fs"
import pg from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"

const file = process.argv[2]
if (!file) {
  console.error("Usage: run-sql.mjs <path-to-sql>")
  process.exit(1)
}

async function main() {
  const useUrl = Boolean(process.env.DATABASE_URL)
  const signer = useUrl
    ? null
    : new Signer({
        credentials: awsCredentialsProvider({
          roleArn: process.env.AWS_ROLE_ARN,
          clientConfig: { region: process.env.AWS_REGION },
        }),
        region: process.env.AWS_REGION,
        hostname: process.env.PGHOST,
        username: process.env.PGUSER || "postgres",
        port: 5432,
      })

  const pool = useUrl
    ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 4 })
    : new pg.Pool({
        host: process.env.PGHOST,
        database: process.env.PGDATABASE || "postgres",
        port: 5432,
        user: process.env.PGUSER || "postgres",
        password: () => signer.getAuthToken(),
        ssl: { rejectUnauthorized: false },
        max: 4,
      })

  const sql = readFileSync(file, "utf8")
  console.log(`[run-sql] connecting to ${process.env.PGHOST || "DATABASE_URL"} ...`)
  const res = await pool.query(sql)
  console.log(`[run-sql] OK: executed ${file}`)
  if (Array.isArray(res)) console.log(`[run-sql] ${res.length} statement result(s)`) 
  await pool.end()
}

main().catch((err) => {
  console.error("[run-sql] FAILED:", err.message)
  process.exit(2)
})
