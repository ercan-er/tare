/**
 * Coupon rules shared by cart (preview) and checkout (real discount).
 * First-visit HELLO15 only works as a signed token HELLO15.<expiresMs>.<sig>
 * minted by /api/promo/claim — bare HELLO15 is rejected. After expiresMs the
 * offer fails even if the code is typed again.
 */

type Coupon = {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  label: string;
};

const COUPONS: Coupon[] = [
  { code: "TARE10", kind: "percent", value: 10, label: "10% off" },
  { code: "SAVE20", kind: "percent", value: 20, label: "20% off" },
  { code: "WELCOME5", kind: "fixed", value: 500, minSubtotal: 3000, label: "$5 off" },
];

export const FIRST_VISIT_CODE = "HELLO15";
export const PROMO_WINDOW_MS = 24 * 60 * 60 * 1000;

const FIRST_VISIT_RULE: Coupon = {
  code: "HELLO15",
  kind: "percent",
  value: 15,
  label: "15% off — first visit",
};

export type CouponResult =
  | { ok: true; code: string; discount: number; label: string }
  | { ok: false; code: string; message: string };

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

const PROMO_TOKEN_RE = /^HELLO15\.(\d+)\.([A-Za-z0-9_-]+)$/i;

export function isPromoToken(raw: string): boolean {
  return PROMO_TOKEN_RE.test(raw.trim());
}

export function promoTokenExpiry(raw: string): number | null {
  const m = raw.trim().match(PROMO_TOKEN_RE);
  if (!m) return null;
  const exp = Number(m[1]);
  return Number.isFinite(exp) ? exp : null;
}

export function evaluateCoupon(
  rawCode: string,
  subtotal: number,
  opts?: { promoSigValid?: boolean },
): CouponResult {
  const trimmed = rawCode.trim();
  if (!trimmed) return { ok: false, code: "", message: "Enter a code." };

  const promo = trimmed.match(PROMO_TOKEN_RE);
  if (promo) {
    const expires = Number(promo[1]);
    const token = `HELLO15.${promo[1]}.${promo[2]}`;
    if (!Number.isFinite(expires) || Date.now() > expires) {
      return { ok: false, code: FIRST_VISIT_CODE, message: "This first-visit offer has expired." };
    }
    if (opts?.promoSigValid === false) {
      return { ok: false, code: FIRST_VISIT_CODE, message: "This first-visit offer isn’t valid." };
    }
    const raw = Math.round((subtotal * FIRST_VISIT_RULE.value) / 100);
    const discount = Math.max(0, Math.min(raw, subtotal));
    return { ok: true, code: token, discount, label: FIRST_VISIT_RULE.label };
  }

  const code = trimmed.toUpperCase();
  if (code === FIRST_VISIT_CODE) {
    return {
      ok: false,
      code,
      message: "Claim your personal code from the banner. It expires in 24 hours.",
    };
  }

  const c = COUPONS.find((x) => x.code === code);
  if (!c) return { ok: false, code, message: "That code isn’t valid." };

  if (c.minSubtotal && subtotal < c.minSubtotal) {
    return { ok: false, code, message: `Spend at least ${money(c.minSubtotal)} to use ${code}.` };
  }

  const raw = c.kind === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
  const discount = Math.max(0, Math.min(raw, subtotal));
  return { ok: true, code, discount, label: c.label };
}
