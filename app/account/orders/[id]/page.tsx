"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ShipmentTracker } from "@/components/shipment-tracker";
import type { Order } from "@/lib/types";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
};

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STATUS_ALERT: Record<Order["status"], string> = {
  pending: "info",
  paid: "ok",
  cancelled: "err",
};

type LoadState = "loading" | "ready" | "notfound" | "error";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (loading) return;
    if (!user) { setState("ready"); return; }

    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const t = await token();
        if (!t || cancelled) return;
        const res = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, {
          headers: { authorization: `Bearer ${t}` },
        });
        if (cancelled) return;
        if (res.status === 404) { setState("notfound"); return; }
        if (!res.ok) { setState("error"); return; }
        setOrder((await res.json()) as Order);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user, token, id]);

  if (loading || (user && state === "loading")) {
    return (
      <div className="wrap" style={{ padding: "60px 0" }}>
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wrap" style={{ padding: "70px 0" }}>
        <div className="empty">
          <h3>Sign in to see this order</h3>
          <p>Your orders live with your account.</p>
          <Link href="/login" className="btn" style={{ marginTop: 16 }}>Sign in</Link>
        </div>
      </div>
    );
  }

  if (state === "notfound" || state === "error") {
    return (
      <div className="wrap" style={{ padding: "70px 0" }}>
        <div className="empty">
          <h3>{state === "notfound" ? "Order not found" : "Could not load this order"}</h3>
          <p>
            {state === "notfound"
              ? "We couldn't find an order with that number on your account."
              : "Something went wrong. Try again in a moment."}
          </p>
          <Link href="/account" className="btn" style={{ marginTop: 16 }}>Back to account</Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="wrap" style={{ padding: "0 0 90px" }}>
      <div className="crumbs">
        <Link href="/">Home</Link> · <Link href="/account">Account</Link> · Order #{order.id}
      </div>

      <div className="sec-head" style={{ marginBottom: 18, alignItems: "center" }}>
        <div>
          <span className="eyebrow">Order</span>
          <h1 className="serif" style={{ fontSize: 34, margin: "6px 0 4px", letterSpacing: "-.015em" }}>
            #{order.id}
          </h1>
          <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
            Placed {fmtDate(order.createdAt)}
          </div>
        </div>
        <span
          className={`alert ${STATUS_ALERT[order.status]}`}
          style={{ padding: "5px 12px", fontSize: 13 }}
          data-testid="order-status"
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="cart-grid">
        <div>
          {order.status !== "cancelled" && (
            <aside className="summary" style={{ position: "static", marginBottom: 22 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 20, margin: "0 0 4px" }}>
                Shipment
              </h3>
              <ShipmentTracker startIso={order.paidAt ?? order.createdAt} />
            </aside>
          )}

          <div className="sec-head" style={{ marginBottom: 10 }}>
            <div><span className="eyebrow">Items</span><h2>What's in this order</h2></div>
          </div>
          {order.items.map((i) => (
            <div className="c-line" key={i.productId} data-testid="order-item" style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>
                  {fmt(i.price)} each · qty {i.quantity}
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "var(--font-serif)", fontSize: 19 }}>
                {fmt(i.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 21, margin: "0 0 12px" }}>
            Summary
          </h3>
          <div className="row"><span>Email</span><span>{order.email ?? "—"}</span></div>
          <div className="row"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
          <div className="row">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : fmt(order.shipping)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span data-testid="order-total">{fmt(order.total)}</span>
          </div>
          <Link href="/account" className="btn ghost block" style={{ marginTop: 16 }}>
            Back to orders
          </Link>
        </aside>
      </div>
    </div>
  );
}
