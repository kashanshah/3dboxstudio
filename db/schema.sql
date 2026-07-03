-- Run once against your Neon database (Neon SQL Editor or psql).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens (user_id);

CREATE TABLE IF NOT EXISTS shared_designs (
  id TEXT PRIMARY KEY,
  preview_token TEXT UNIQUE,
  name TEXT,
  config JSONB NOT NULL,
  images JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  og_image_key TEXT,
  og_image_width INTEGER,
  og_image_height INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table already exists, run: npm run db:migrate

CREATE INDEX IF NOT EXISTS idx_shared_designs_expires_at ON shared_designs (expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_designs_user ON shared_designs (user_id);
