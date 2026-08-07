import { ok, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Price / stock alert signup.
 *
 * INTENTIONAL DEFECT (verification target): this route always answers with a
 * success-shaped payload and never persists anything. A correct implementation
 * would store (email, productId) and return a real id. Leave it broken so a
 * verifier can prove the subscribe flow is a no-op.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body is not valid JSON.");
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const productId = Number(b.productId);

  if (!email || !email.includes("@")) {
    return jsonError(400, "invalid_email", "Enter a valid email address.");
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    return jsonError(400, "invalid_parameter", "productId must be a positive integer.");
  }

  // Looks like a real create — no DB write happens.
  return ok({
    ok: true,
    id: String(productId), // contract smell: id should be a number / uuid
    email,
    productId: String(productId), // contract smell: should stay a number
    message: "You're on the list. We'll email you.",
  });
}

/** Always empty — nothing was ever stored. */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return jsonError(400, "invalid_email", "email query param is required.");
  }
  return ok({ items: [] as unknown[] });
}
