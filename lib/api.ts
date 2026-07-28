import type { ApiError } from "./types";

export function jsonError(
  status: number,
  code: string,
  message: string
): Response {
  const body: ApiError = { error: { code, message } };
  return Response.json(body, { status });
}

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function intParam(
  v: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  // Careful: Number(null) === 0 and Number("") === 0, and both are finite.
  // So the absence check has to happen BEFORE Number(), otherwise a missing
  // parameter gets clamped to `min` instead of falling back to `fallback`.
  if (v === null || v.trim() === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
