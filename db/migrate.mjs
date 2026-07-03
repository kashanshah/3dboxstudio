import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { customAlphabet } from "nanoid";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key !== "DATABASE_URL") continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch {
    /* .env.local may be missing in CI */
  }

  return null;
}

const databaseUrl = loadDatabaseUrl();
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it in your shell.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const createPreviewToken = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS name TEXT`;
console.log("OK: shared_designs.name column is ready.");

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS preview_token TEXT`;
console.log("OK: shared_designs.preview_token column is ready.");

try {
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_designs_preview_token ON shared_designs (preview_token)`;
  console.log("OK: preview_token unique index is ready.");
} catch (e) {
  console.warn("Could not create preview_token index (may already exist):", e.message);
}

const missing = await sql`SELECT id FROM shared_designs WHERE preview_token IS NULL`;
for (const row of missing) {
  let token = createPreviewToken();
  let inserted = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await sql`UPDATE shared_designs SET preview_token = ${token} WHERE id = ${row.id} AND preview_token IS NULL`;
      inserted = true;
      break;
    } catch {
      token = createPreviewToken();
    }
  }
  if (!inserted) {
    console.error(`Failed to backfill preview_token for share ${row.id}`);
    process.exit(1);
  }
}

if (missing.length > 0) {
  console.log(`OK: backfilled preview_token for ${missing.length} existing share(s).`);
} else {
  console.log("OK: all shares already have preview_token.");
}

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS og_image_key TEXT`;
console.log("OK: shared_designs.og_image_key column is ready.");

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS og_image_width INTEGER`;
console.log("OK: shared_designs.og_image_width column is ready.");

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS og_image_height INTEGER`;
console.log("OK: shared_designs.og_image_height column is ready.");

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
console.log("OK: shared_designs.updated_at column is ready.");

await sql`UPDATE shared_designs SET updated_at = created_at WHERE updated_at IS NULL`;
console.log("OK: backfilled updated_at from created_at where needed.");
