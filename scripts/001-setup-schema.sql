-- RoofPitch schema
-- Contractors, homeowner measurement requests, and the many-to-many match table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- Contractors (roofing companies applying to be listed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contractors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company       VARCHAR(160) NOT NULL,
  contact_name  VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(40),
  service_area  VARCHAR(120),           -- free-text area the company covers
  postal_prefix VARCHAR(3),             -- crude area key for matching (e.g. "M5V" -> "M")
  specialties   TEXT[] NOT NULL DEFAULT '{}',
  status        VARCHAR(12) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_postal_prefix ON contractors(postal_prefix);
-- Approved contractors in a given area is the hot path for matching.
CREATE INDEX IF NOT EXISTS idx_contractors_approved_area
  ON contractors(postal_prefix) WHERE status = 'approved';

-- ----------------------------------------------------------------------------
-- Measurement requests (a homeowner asking for quotes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurement_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address        VARCHAR(255) NOT NULL,
  postal_code    VARCHAR(12) NOT NULL,
  product        VARCHAR(40) NOT NULL,
  color          VARCHAR(60),
  homeowner_email VARCHAR(160),
  status         VARCHAR(24) NOT NULL DEFAULT 'created'
                 CHECK (status IN ('created','measurement_ordered','measurement_ready','contractors_notified','failed')),
  job_id         VARCHAR(120),          -- id returned by the measurement provider
  provider       VARCHAR(40),
  report_url     TEXT,
  materials_url  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_job_id ON measurement_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON measurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON measurement_requests(created_at DESC);

-- ----------------------------------------------------------------------------
-- Which contractors were matched to a request (many-to-many)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_contractors (
  request_id    UUID NOT NULL REFERENCES measurement_requests(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  notified_at   TIMESTAMPTZ,
  PRIMARY KEY (request_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_request_contractors_contractor ON request_contractors(contractor_id);
