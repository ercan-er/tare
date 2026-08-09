import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

async function check(table) {
  try {
    const r = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    console.log(table, Number(r.rows[0].n));
  } catch (e) {
    console.log(table, "MISSING", e.message);
  }
}

await check("products");
await check("product_variants");
await check("product_images");
await check("product_insights");

try {
  const r = await client.execute(
    "SELECT slug FROM products WHERE slug = 'tare-k2-hand-grinder' LIMIT 1",
  );
  console.log("sample", r.rows[0]?.slug ?? "not found");
} catch (e) {
  console.log("sample FAIL", e.message);
}
