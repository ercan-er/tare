"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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

type LoadState = "loading" | "ready" | "error";

export default function AccountPage() {
  const { user, loading, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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
        const res = await fetch("/api/orders", {
          headers: { authorization: `Bearer ${t}` },
        });
        if (cancelled) return;
        if (!res.ok) { setState("error"); return; }
        const data = (await res.json()) as { items: Order[] };
        setOrders(data.items ?? []);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user, token]);

  if (loading) {
    return (
      <div className="wrap" style={{ padding: "60px 0" }}>
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wrap" style={{ padding: "70px 0" }}>
        <div className="empty">
          <h3>Sign in to see your account</h3>
          <p>Your order history and details live with your account.</p>
          <Link href="/login" className="btn" style={{ marginTop: 16 }}>Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "0 0 90px" }}>
      <div className="crumbs"><Link href="/">Home</Link> · Account</div>

      <span className="eyebrow">Account</span>
      <h1 className="serif" style={{ fontSize: 36, margin: "10px 0 6px", letterSpacing: "-.015em" }}>
        Your account
      </h1>

      <aside className="summary" style={{ maxWidth: 460, marginBottom: 34, position: "static" }}>
        <div className="row">
          <span>Email</span>
          <span data-testid="account-email">{user.email ?? "—"}</span>
        </div>
        <div className="row">
          <span>Orders</span>
          <span data-testid="account-order-count">{orders.length}</span>
        </div>
      </aside>

      <div className="sec-head" style={{ marginBottom: 14 }}>
        <div>
          <span className="eyebrow">History</span>
          <h2>Your orders</h2>
        </div>
      </div>

      {state === "loading" && <div className="skeleton" style={{ height: 160 }} />}

      {state === "error" && (
        <div className="alert err">We could not load your orders. Try refreshing the page.</div>
      )}

      {state === "ready" && orders.length === 0 && (
        <div className="empty">
          <h3>No orders yet</h3>
          <p>Once you place an order it will show up here.</p>
          <Link href="/products" className="btn" style={{ marginTop: 16 }}>Browse products</Link>
        </div>
      )}

      {state === "ready" && orders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }} data-testid="order-list">
          {orders.map((order) => (
            <aside
              key={order.id}
              className="summary"
              style={{ position: "static", maxWidth: "none" }}
              data-testid="order-row"
            >
              <div
                className="sec-head"
                style={{ marginBottom: 12, alignItems: "center" }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>
                    Order #{order.id}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>
                    {fmtDate(order.createdAt)}
                  </div>
                </div>
                <span
                  className={`alert ${STATUS_ALERT[order.status]}`}
                  style={{ padding: "4px 10px", fontSize: 12.5 }}
                  data-testid="order-status"
                >
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              {order.items.map((i) => (
                <div className="row" key={i.productId} data-testid="order-item">
                  <span>{i.name} × {i.quantity}</span>
                  <span>{fmt(i.lineTotal)}</span>
                </div>
              ))}

              <div className="row">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "Free" : fmt(order.shipping)}</span>
              </div>
              <div className="row total">
                <span>Total</span>
                <span data-testid="order-total">{fmt(order.total)}</span>
              </div>

              {order.status !== "cancelled" && (
                <ShipmentTracker startIso={order.paidAt ?? order.createdAt} />
              )}
            </aside>
          ))}
        </div>
      )}
    </div>
  );
}
