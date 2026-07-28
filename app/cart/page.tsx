"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { useEffect } from "react";
import { trackViewCart } from "@/lib/metrics";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

export default function CartPage() {
  const { user, loading } = useAuth();
  const { cart, setLine, clear, busy, error } = useCart();

  useEffect(() => {
    if (cart.itemCount > 0) void trackViewCart(cart.subtotal, cart.itemCount);
  }, [cart.itemCount, cart.subtotal]);

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
          <h3>Your cart lives with your account</h3>
          <p>Sign in to see your cart and add items to it.</p>
          <Link href="/login" className="btn" style={{ marginTop: 16 }}>Sign in</Link>
        </div>
      </div>
    );
  }

  const shipping = cart.subtotal === 0 || cart.subtotal >= 7500 ? 0 : 900;

  return (
    <div className="wrap">
      <div className="crumbs"><Link href="/">Home</Link> · Cart</div>

      {cart.lines.length === 0 ? (
        <div style={{ padding: "50px 0 80px" }}>
          <div className="empty">
            <h3>Your cart is empty</h3>
            <p>Have a look through the catalogue and add something.</p>
            <Link href="/products" className="btn" style={{ marginTop: 16 }}>Browse products</Link>
          </div>
        </div>
      ) : (
        <div className="cart-grid">
          <div>
            <div className="sec-head" style={{ marginBottom: 6 }}>
              <div>
                <span className="eyebrow">Cart</span>
                <h2 data-testid="cart-count">
                  {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
                </h2>
              </div>
              <button className="btn ghost sm" onClick={() => void clear()} disabled={busy}>
                Empty cart
              </button>
            </div>

            {error && <div className="alert err" style={{ marginBottom: 14 }}>{error}</div>}

            {cart.lines.map((l) => (
              <div className="c-line" key={l.productId} data-testid="cart-line">
                <div className="c-thumb">
                  {l.imageUrl ? <img src={l.imageUrl} alt={l.name} /> : null}
                </div>
                <div>
                  <Link href={`/products/${l.slug}`} style={{ fontWeight: 600 }}>
                    {l.name}
                  </Link>
                  <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>
                    {fmt(l.price)} each · {l.stock} in stock
                  </div>
                  <div className="qty" style={{ marginTop: 10 }}>
                    <button onClick={() => void setLine(l.productId, l.quantity - 1)} disabled={busy} aria-label="Decrease">−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => void setLine(l.productId, l.quantity + 1)} disabled={busy || l.quantity >= l.stock} aria-label="Increase">+</button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>
                    {fmt(l.lineTotal)}
                  </div>
                  <button
                    className="btn ghost sm"
                    style={{ marginTop: 10 }}
                    onClick={() => void setLine(l.productId, 0)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 21, margin: "0 0 12px" }}>
              Summary
            </h3>
            <div className="row"><span>Subtotal</span><span data-testid="subtotal">{fmt(cart.subtotal)}</span></div>
            <div className="row">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : fmt(shipping)}</span>
            </div>
            {shipping > 0 && (
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "6px 0 0" }}>
                Free shipping on orders over $75.
              </p>
            )}
            <div className="row total">
              <span>Total</span>
              <span data-testid="total">{fmt(cart.subtotal + shipping)}</span>
            </div>
            <button className="btn block" style={{ marginTop: 16 }} disabled>
              Checkout
            </button>
            <p style={{ fontSize: 12, color: "var(--faint)", margin: "10px 0 0", textAlign: "center" }}>
              This is a demo store. Checkout is disabled.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
