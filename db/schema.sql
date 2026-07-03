-- Run once against your Neon database (Neon SQL Editor or psql).

CREATE TABLE IF NOT EXISTS shared_designs (
  id TEXT PRIMARY KEY,
  name TEXT,
  config JSONB NOT NULL,
  images JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by TEXT,
  view_count INTEGER NOT NULL DEFAULT 0
);

-- If the table already exists without name, run:
-- ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS name TEXT;

CREATE INDEX IF NOT EXISTS idx_shared_designs_expires_at ON shared_designs (expires_at);
