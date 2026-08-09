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
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}
