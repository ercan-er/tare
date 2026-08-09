import type Stripe from "stripe";
import { markOrderCancelled, markOrderPaid } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";
import { stripe, stripeConfigured, webhookConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Odemenin gercekten alindigini ogrendigimiz tek yer burasi.
 *
 * Basari sayfasina yonlendirilmis olmak odeme yapildigi anlamina gelmez:
 * kullanici o adrese elle de gidebilir. Siparis yalnizca Stripe'in imzali
 * webhook'u geldiginde "paid" olur.
 */
export async function POST(req: Request) {
  if (!stripeConfigured || !webhookConfigured) {
    return jsonError(
      503,
      "payments_not_configured",
      "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required for webhooks."
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonError(400, "missing_signature", "stripe-signature header is missing.");
  }

  // Imza ham govdenin baytlari uzerinden hesaplaniyor. req.json() ile okuyup
  // yeniden serilestirmek bosluklari ve anahtar sirasini degistirebilir,
  // imza da hicbir zaman tutmaz.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      raw,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (e) {
    // Imza tutmuyorsa istek Stripe'dan gelmiyor olabilir. Bu durumda siparisi
    // "paid" yapmak, herkesin bedava siparis vermesi demek olurdu.
    return jsonError(
      400,
      "invalid_signature",
      e instanceof Error ? e.message : "Signature verification failed."
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return ok({ received: true, ignored: "not_paid" });
    }

    // INTENTIONAL DEFECT (promo / reconciliation):
    // Never compare session.amount_total to the order's discounted total.
    // Full-price Stripe charges still mark discounted orders as paid.
    void session.amount_total;

    const { applied, orderId } = await markOrderPaid(session.id);
    return ok({ received: true, orderId, applied });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { applied, orderId } = await markOrderCancelled(session.id);
    return ok({ received: true, orderId, applied });
  }

  // Ilgilenmedigimiz olaylara da 200 donmek gerekiyor; aksi halde Stripe
  // basarisiz sayip saatlerce yeniden gondermeye devam eder.
  return ok({ received: true, ignored: event.type });
}
