import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

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

await sql`ALTER TABLE shared_designs ADD COLUMN IF NOT EXISTS name TEXT`;
console.log("OK: shared_designs.name column is ready.");
