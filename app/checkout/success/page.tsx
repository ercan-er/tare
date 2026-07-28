"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import type { Order } from "@/lib/types";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

const MAX_ATTEMPTS = 10;
const POLL_MS = 1500;

type State = "loading" | "waiting" | "done" | "missing" | "error";

function SuccessInner() {
  const sessionId = useSearchParams().get("session_id");
  const { user, loading, token } = useAuth();
  const { refresh } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (loading) return;
    if (!user || !sessionId) { setState("missing"); return; }

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /**
     * Stripe kullaniciyi buraya webhook'tan once yollayabiliyor; ikisi
     * birbirinden bagimsiz. O yuzden siparis "paid" olana kadar kisa
     * araliklarla tekrar soruyoruz.
     */
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const t = await token();
        if (!t || cancelled) return;

        const res = await fetch(
          `/api/orders?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { authorization: `Bearer ${t}` } }
        );
        if (cancelled) return;

        if (res.ok) {
          const o = (await res.json()) as Order;
          setOrder(o);
          if (o.status === "paid") { setState("done"); return; }
          setState("waiting");
        } else if (res.status !== 404) {
          setState("error");
          return;
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) { setState("error"); return; }
      }

      if (attempts < MAX_ATTEMPTS) {
        timer = setTimeout(() => void poll(), POLL_MS);
      } else {
        setState((s) => (s === "loading" ? "error" : s));
      }
    };

    void poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [loading, user, sessionId, token]);

  // Odeme onaylandiginda sepet sunucuda bosaltilmis oluyor; basliktaki sayinin
  // da guncellenmesi icin istemci tarafini tazeliyoruz.
  useEffect(() => {
    if (state === "done") void refresh();
  }, [state, refresh]);

  if (loading || state === "loading") {
    return <div className="skeleton" style={{ height: 200 }} />;
  }

  if (state === "missing") {
    return (
      <div className="empty">
        <h3>Nothing to show here</h3>
        <p>This page needs a checkout session, and you need to be signed in.</p>
        <Link href="/products" className="btn" style={{ marginTop: 16 }}>
          Browse products
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="empty">
        <h3>We could not confirm this order</h3>
        <p>
          If you were charged, the order will still appear once the payment
          notification arrives. Nothing was lost.
        </p>
        <Link href="/cart" className="btn" style={{ marginTop: 16 }}>Back to cart</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 0 80px" }}>
      {state === "waiting" ? (
        <div className="alert info" style={{ marginBottom: 20 }} data-testid="order-pending">
          Payment received. Waiting for Stripe to confirm — this usually takes a
          second.
        </div>
      ) : (
        <div className="alert ok" style={{ marginBottom: 20 }} data-testid="order-paid">
          Payment confirmed. Thank you.
        </div>
      )}

      <span className="eyebrow">Order</span>
      <h2 style={{ marginTop: 4 }} data-testid="order-id">
        #{order?.id ?? "—"}
      </h2>

      {order && (
        <aside className="summary" style={{ marginTop: 22, maxWidth: 460 }}>
          {order.items.map((i) => (
            <div className="row" key={i.productId} data-testid="order-item">
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>{fmt(i.lineTotal)}</span>
            </div>
          ))}
          <div className="row"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
          <div className="row">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : fmt(order.shipping)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span data-testid="order-total">{fmt(order.total)}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--faint)", margin: "12px 0 0", textAlign: "center" }}>
            Test mode. No real payment was taken.
          </p>
        </aside>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/products" className="btn">Continue shopping</Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="wrap">
      <div className="crumbs"><Link href="/">Home</Link> · Order</div>
      {/* useSearchParams prerender sirasinda Suspense sinirina ihtiyac duyuyor. */}
      <Suspense fallback={<div className="skeleton" style={{ height: 200 }} />}>
        <SuccessInner />
      </Suspense>
    </div>
  );
}
