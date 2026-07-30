import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const PROMO_WINDOW_MS = 24 * 60 * 60 * 1000;

function secret() {
  return (
    process.env.PROMO_SIGNING_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "tare-dev-promo"
  );
}

function sign(expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(`HELLO15.${expiresAt}`)
    .digest("base64url")
    .slice(0, 12);
}

export function mintPromoToken(expiresAt: number): string {
  const exp = Math.floor(expiresAt);
  return `HELLO15.${exp}.${sign(exp)}`;
}

export function verifyPromoToken(raw: string): boolean {
  const m = raw.trim().match(/^HELLO15\.(\d+)\.([A-Za-z0-9_-]+)$/i);
  if (!m) return false;
  const exp = Number(m[1]);
  if (!Number.isFinite(exp)) return false;
  const expected = sign(exp);
  const got = m[2];
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(got);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function resolvePromoExpiry(clientEndsAt: unknown): number {
  const now = Date.now();
  const max = now + PROMO_WINDOW_MS;
  if (typeof clientEndsAt === "number" && Number.isFinite(clientEndsAt)) {
    if (clientEndsAt > now && clientEndsAt <= max + 60_000) {
      return Math.floor(clientEndsAt);
    }
  }
  return max;
}
