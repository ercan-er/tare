import { db } from "@/lib/db";
import { ok, jsonError } from "@/lib/api";
import { activeFault } from "@/lib/faults";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await db().execute("SELECT 1");
    return ok({
      status: "ok",
      database: "reachable",
      faultInjection: activeFault(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? "development",
      latencyMs: Date.now() - started,
      time: new Date().toISOString(),
    });
  } catch (e) {
    return jsonError(
      503,
      "database_unreachable",
      e instanceof Error ? e.message : "Database is unreachable."
    );
  }
}
