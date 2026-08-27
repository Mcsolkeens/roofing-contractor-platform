/**
 * Database schema + seed, inlined as strings so they are always bundled into
 * the serverless function. (Reading .sql files from disk at runtime fails in
 * production because Next.js does not trace the /scripts folder into the
 * function output.)
 *
 * Every statement is idempotent (IF NOT EXISTS / ON CONFLICT), so the migration
 * endpoint is safe to run repeatedly.
 */

export const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contractors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company       VARCHAR(160) NOT NULL,
  contact_name  VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(40),
  service_area  VARCHAR(120),
  postal_prefix VARCHAR(3),
  specialties   TEXT[] NOT NULL DEFAULT '{}',
  status        VARCHAR(12) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_postal_prefix ON contractors(postal_prefix);
CREATE INDEX IF NOT EXISTS idx_contractors_approved_area
  ON contractors(postal_prefix) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS measurement_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address        VARCHAR(255) NOT NULL,
  postal_code    VARCHAR(12) NOT NULL,
  product        VARCHAR(40) NOT NULL,
  color          VARCHAR(60),
  homeowner_email VARCHAR(160),
  status         VARCHAR(24) NOT NULL DEFAULT 'created'
                 CHECK (status IN ('created','measurement_ordered','measurement_ready','contractors_notified','failed')),
  job_id         VARCHAR(120),
  provider       VARCHAR(40),
  report_url     TEXT,
  materials_url  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_job_id ON measurement_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON measurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON measurement_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS request_contractors (
  request_id    UUID NOT NULL REFERENCES measurement_requests(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  notified_at   TIMESTAMPTZ,
  PRIMARY KEY (request_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_request_contractors_contractor ON request_contractors(contractor_id);

CREATE TABLE IF NOT EXISTS report_files (
  key          TEXT PRIMARY KEY,
  content_type VARCHAR(80) NOT NULL DEFAULT 'application/pdf',
  bytes        BYTEA NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

/**
 * Demo contractors. postal_prefix is a real Canadian FSA (first 3 chars of a
 * postal code); matching is done on the metro "area key" (letter+digit), so
 * M5V/M5H = downtown Toronto, P3A = Greater Sudbury, L5B = Mississauga.
 *
 * Northern Peak (Sudbury) is seeded as approved so Sudbury postal codes return
 * a match immediately for testing. Unserved areas (e.g. Halifax B3H) correctly
 * return none.
 */
export const SEED_SQL = `
INSERT INTO contractors (company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
SELECT * FROM (VALUES
  ('Summit Roofing Co.',    'Dave Nguyen',   'leads@summitroofing.example', '416-555-0110', 'Downtown Toronto',       'M5V', ARRAY['shingles','metal'],        'approved'),
  ('Maple Leaf Exteriors',  'Sarah Bianchi', 'quotes@mapleleaf.example',    '416-555-0134', 'Downtown Toronto',       'M5H', ARRAY['shingles','flat'],         'approved'),
  ('Northern Peak Roofers', 'Tom Reyes',     'hello@northernpeak.example',  '705-555-0177', 'Greater Sudbury',        'P3A', ARRAY['metal','shingles'],        'approved'),
  ('TrueLine Roofing',      'Priya Shah',    'office@trueline.example',     '905-555-0199', 'Mississauga, Oakville',  'L5B', ARRAY['shingles','flat','metal'], 'pending')
) AS seed(company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
-- Only seed when the table is empty, so re-running migrate never duplicates.
WHERE NOT EXISTS (SELECT 1 FROM contractors);
`
