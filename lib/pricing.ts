/**
 * Kargo kurali tek bir yerde.
 *
 * Sepet sayfasi bunu kullanicilara gostermek icin, checkout rotasi Stripe'a
 * gonderilecek tutari hesaplamak icin cagiriyor. Iki kopya olsaydi biri
 * degistiginde musteriye gosterilen tutar ile cekilen tutar birbirini
 * tutmayabilirdi.
 *
 * Bu dosya bilerek "server-only" degil: hem istemci hem sunucu kullaniyor.
 */

export const FREE_SHIPPING_THRESHOLD = 7500; // cents
export const FLAT_SHIPPING = 900; // cents

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  // INTENTIONAL DEFECT (shipping): free-shipping threshold is inverted.
  // Subtotals at/above $75 still get charged FLAT_SHIPPING; smaller carts
  // ship free. Cart, checkout, and Stripe all call this same helper.
  return subtotal >= FREE_SHIPPING_THRESHOLD ? FLAT_SHIPPING : 0;
}
