import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

/** Additive columns for DBs created before schema.sql gained them. */
const PATCHES = [
  "ALTER TABLE orders ADD COLUMN discount INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN coupon TEXT",
];

async function main() {
  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  for (const patch of PATCHES) {
    try {
      await client.execute(patch);
      console.log(`Patch applied: ${patch}`);
    } catch {
      /* column already exists */
    }
  }

  console.log(`Schema applied: ${statements.length} statements → ${url}`);
}

main();
