/**
 * Kupon kurallari tek bir yerde. Kargo kurali (pricing.ts) gibi bu dosya da
 * bilerek "server-only" degil: sepet sayfasi onizleme icin, checkout rotasi
 * gercek indirimi hesaplamak icin ayni fonksiyonu cagirir. Boylece musteriye
 * gosterilen indirim ile siparise islenen indirim her zaman ayni olur.
 *
 * Istemci yalnizca KODU gonderir; indirim tutarini asla istemci belirlemez.
 */

type Coupon = {
  code: string;
  kind: "percent" | "fixed";
  value: number; // percent: yuzde (10 = %10), fixed: cents
  minSubtotal?: number; // cents
  label: string;
};

const COUPONS: Coupon[] = [
  { code: "TARE10", kind: "percent", value: 10, label: "10% off" },
  { code: "SAVE20", kind: "percent", value: 20, label: "20% off" },
  { code: "WELCOME5", kind: "fixed", value: 500, minSubtotal: 3000, label: "$5 off" },
];

export type CouponResult =
  | { ok: true; code: string; discount: number; label: string }
  | { ok: false; code: string; message: string };

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

/**
 * Kodu degerlendirir. subtotal (cents) uzerinden indirimi hesaplar; indirim
 * asla subtotal'i asmaz.
 */
export function evaluateCoupon(rawCode: string, subtotal: number): CouponResult {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, code, message: "Enter a code." };

  const c = COUPONS.find((x) => x.code === code);
  if (!c) return { ok: false, code, message: "That code isn’t valid." };

  if (c.minSubtotal && subtotal < c.minSubtotal) {
    return { ok: false, code, message: `Spend at least ${money(c.minSubtotal)} to use ${code}.` };
  }

  const raw = c.kind === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
  const discount = Math.max(0, Math.min(raw, subtotal));
  return { ok: true, code, discount, label: c.label };
}
