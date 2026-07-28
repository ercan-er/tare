import "server-only";
import Stripe from "stripe";

/**
 * Stripe istemcisi, db() ve admin() ile ayni tembel baslatma kalibinda.
 *
 * Modul yuklenirken degil, ilk kullanimda kuruluyor. Boylece anahtar yokken
 * uygulamanin geri kalani (katalog, sepet) calismaya devam ediyor; sadece
 * odeme yolu 503 donuyor.
 */

let client: Stripe | null = null;

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

/** Webhook imzasi dogrulanamiyorsa odemeyi onaylamak guvenli degil. */
export const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Get a test key from the Stripe dashboard."
    );
  }

  // Bu magaza kalici olarak test modunda. Canli anahtar kazayla ortam
  // degiskenlerine dusarse gercek para hareket edebilirdi; burada durduruyoruz.
  if (key.startsWith("sk_live_")) {
    throw new Error(
      "A live Stripe key was supplied. This store is test-mode only; use an sk_test_ key."
    );
  }

  client = new Stripe(key);
  return client;
}

/**
 * Stripe'in geri donecegi mutlak adres.
 *
 * Vercel'de her preview farkli bir alan adinda calisiyor, o yuzden sabit bir
 * URL yazilamaz. Istegin kendi origin'i her ortamda dogru sonucu veriyor.
 */
export function originOf(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;

  return new URL(req.url).origin;
}
