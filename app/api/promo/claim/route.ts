import { ok, jsonError } from "@/lib/api";
import {
  mintPromoToken,
  resolvePromoExpiry,
} from "@/lib/promo-token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let endsAt: unknown;
  try {
    const body = (await req.json()) as { endsAt?: unknown };
    endsAt = body?.endsAt;
  } catch {
    endsAt = undefined;
  }

  const expiresAt = resolvePromoExpiry(endsAt);
  if (expiresAt <= Date.now()) {
    return jsonError(400, "expired", "This first-visit offer has expired.");
  }

  const code = mintPromoToken(expiresAt);
  return ok({ code, expiresAt, display: "HELLO15" });
}
