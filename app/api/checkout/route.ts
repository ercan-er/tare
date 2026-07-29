import { createPendingOrder, markOrderPaid, setOrderSession } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/guard";
import { stripe, stripeConfigured, originOf } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Demo modu: siparis, Stripe'a hic gitmeden aninda "paid" sayilir. Sadece
// yerel/gosterim icindir; gercek odeme onayi (webhook) mantigini baypas eder.
// Uretimde bu bayragi bos birak; siparisler yalnizca imzali webhook ile
// "paid" olmaya devam eder.
const DEMO_INSTANT_PAID =
  process.env.DEMO_INSTANT_PAID === "1" || process.env.DEMO_INSTANT_PAID === "true";

/**
 * Sepeti "pending" bir siparise cevirir ve Stripe Checkout oturumu acar.
 *
 * Istek govdesi bilerek okunmuyor. Tutar, adet ve urun bilgisinin tamami
 * sunucuda veritabanindan hesaplaniyor; tarayicidan gelen bir fiyat olsaydi
 * kullanici onu degistirip istedigi tutari odeyebilirdi.
 */
export async function POST(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;

  if (!stripeConfigured && !DEMO_INSTANT_PAID) {
    return jsonError(
      503,
      "payments_not_configured",
      "STRIPE_SECRET_KEY is not configured on the server."
    );
  }

  const result = await createPendingOrder(user.uid, user.email);
  if (!result.ok) {
    return jsonError(
      result.code === "empty_cart" ? 400 : 409,
      result.code,
      result.message
    );
  }

  const order = result.order;
  const origin = originOf(req);

  // Demo: Stripe'i atla, siparisi hemen odenmis yap (stok duser, sepet
  // bosalir, kargo takibi baslar) ve dogrudan onay sayfasina yolla.
  if (DEMO_INSTANT_PAID) {
    const fakeSession = `demo_${order.id}_${Date.now()}`;
    await setOrderSession(order.id, fakeSession);
    await markOrderPaid(fakeSession);
    return ok({
      url: `${origin}/checkout/success?session_id=${fakeSession}`,
      orderId: order.id,
    });
  }

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(order.id),
      customer_email: user.email ?? undefined,
      line_items: order.items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "usd",
          unit_amount: i.price, // zaten cents; donusum yok, yuvarlama hatasi yok
          product_data: { name: i.name },
        },
      })),
      shipping_options:
        order.shipping > 0
          ? [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  fixed_amount: { amount: order.shipping, currency: "usd" },
                  display_name: "Standard shipping",
                },
              },
            ]
          : undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId: String(order.id), uid: user.uid },
    });

    await setOrderSession(order.id, session.id);

    return ok({ url: session.url, orderId: order.id });
  } catch (e) {
    // Siparis "pending" olarak kaliyor. Odeme alinmadigi icin stok dusmedi ve
    // sepet bosalmadi, yani kullanici tekrar deneyebilir.
    return jsonError(
      502,
      "stripe_error",
      e instanceof Error ? e.message : "Could not start checkout."
    );
  }
}
