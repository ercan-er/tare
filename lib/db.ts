import { createClient, type Client } from "@libsql/client";

/**
 * Why libSQL instead of plain SQLite?
 *
 * Vercel's serverless functions have an ephemeral filesystem and every
 * invocation runs isolated. A classic `better-sqlite3` + `data.db` setup
 * cannot write in production, and reads are unreliable too.
 *
 * libSQL *is* SQLite, but it can also speak HTTP. Locally it runs as a plain
 * file (`file:local.db`); on Vercel it runs as remote SQLite (`libsql://…`).
 * The SQL dialect is identical, so there is no branching in the code.
 */

let client: Client | null = null;

export function db(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. For local development put file:local.db in .env.local"
    );
  }

  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  return client;
}

/** Formats integer cents as a display price. 4200 → $42 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
