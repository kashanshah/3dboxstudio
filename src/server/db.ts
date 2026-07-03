import { neon } from "@neondatabase/serverless";
import { requireEnv } from "./env";

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    sql = neon(requireEnv("DATABASE_URL"));
  }
  return sql;
}
