import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * OpenTelemetry yapilandirmasini tarayicidan gorulebilir hale getirir.
 *
 * Span'lar sunucudan collector'a gidiyor, yani tarayicinin ag sekmesinde
 * hicbir izi yok. Bu uc nokta o boslugu dolduruyor.
 *
 * DIKKAT: burasi *erisilebilirlik ve kimlik* olcer, span teslimatini degil.
 * Gercek span akisi yalnizca Vercel runtime log'larindaki
 * "@vercel/otel/otlp: onSuccess <status>" satirlarinda gorunur.
 */

function headerNames(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((p) => p.slice(0, p.indexOf("=")).trim())
    .filter(Boolean);
}

export async function GET() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (!endpoint) {
    return ok({
      configured: false,
      reason:
        "OTEL_EXPORTER_OTLP_ENDPOINT is not set, so tracing is switched off entirely.",
    });
  }

  const url = `${endpoint.replace(/\/+$/, "")}/v1/traces`;
  const rawHeaders = process.env.OTEL_EXPORTER_OTLP_HEADERS;

  // Baslik *isimlerini* gosteriyoruz, degerlerini degil: degerler api
  // anahtari tasiyor ve bu uc nokta herkese acik.
  const names = headerNames(rawHeaders);

  const headers: Record<string, string> = { "Content-Type": "application/x-protobuf" };
  for (const pair of (rawHeaders ?? "").split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const k = pair.slice(0, eq).trim();
    if (k) headers[k] = pair.slice(eq + 1).trim();
  }

  let probe: Record<string, unknown>;
  const started = Date.now();

  try {
    // Bilerek bos govde. Amac span gondermek degil, kimligin kabul edilip
    // edilmedigini ogrenmek. Kimlik gecerliyse collector govde eksikliginden
    // sikayet eder (4xx ama 401 degil); gecersizse 401 doner.
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: new Uint8Array(),
      signal: AbortSignal.timeout(8000),
    });

    probe = {
      status: res.status,
      reachable: true,
      authAccepted: res.status !== 401 && res.status !== 403,
      latencyMs: Date.now() - started,
      meaning:
        res.status === 401 || res.status === 403
          ? "Credentials rejected — check OTEL_EXPORTER_OTLP_HEADERS."
          : res.status >= 200 && res.status < 300
            ? "Collector accepted an empty payload, which is unusual but harmless."
            : "Collector reachable and credentials accepted; it only rejected the empty body.",
    };
  } catch (e) {
    probe = {
      reachable: false,
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
      meaning: "The collector could not be reached at all.",
    };
  }

  return ok({
    configured: true,
    endpoint: url,
    serviceName: process.env.OTEL_SERVICE_NAME ?? "tare-storefront",
    authHeaders: names,
    logLevel: process.env.OTEL_LOG_LEVEL ?? null,
    environment: process.env.VERCEL_ENV ?? "development",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    probe,
    note:
      "This checks reachability and credentials, not span delivery. Real span " +
      "exports appear in the runtime logs as '@vercel/otel/otlp: onSuccess <status>' " +
      "and require OTEL_LOG_LEVEL=debug.",
  });
}
