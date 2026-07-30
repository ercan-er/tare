"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { useEffect, useState } from "react";
import { trackViewCart } from "@/lib/metrics";
import { shippingFor } from "@/lib/pricing";
import { evaluateCoupon } from "@/lib/coupons";
import { useToast } from "@/components/toast-provider";

const COUPON_KEY = "tare:coupon";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

export default function CartPage() {
  const { user, loading, token } = useAuth();
  const { cart, setLine, clear, busy, error } = useCart();
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (cart.itemCount > 0) void trackViewCart(cart.subtotal, cart.itemCount);
  }, [cart.itemCount, cart.subtotal]);

  // Uygulanan kuponu diskten geri yukle.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COUPON_KEY);
      if (saved) { setCouponCode(saved); setCouponInput(saved); }
    } catch { /* yok say */ }
  }, []);

  // Kodu her zaman guncel subtotal'a gore degerlendir (min tutar degisebilir).
  const couponEval = couponCode ? evaluateCoupon(couponCode, cart.subtotal) : null;
  const discount = couponEval?.ok ? couponEval.discount : 0;

  function applyCoupon() {
    const res = evaluateCoupon(couponInput, cart.subtotal);
    if (!res.ok) { setCouponError(res.message); return; }
    setCouponCode(res.code);
    setCouponError(null);
    try { localStorage.setItem(COUPON_KEY, res.code); } catch { /* yok say */ }
    toast(`Coupon ${res.code} applied — ${res.label}`, { type: "success" });
  }

  function removeCoupon() {
    setCouponCode(null);
    setCouponInput("");
    setCouponError(null);
    try { localStorage.removeItem(COUPON_KEY); } catch { /* yok say */ }
  }

  async function startCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const t = await token();
      if (!t) {
        setCheckoutError("Your session expired. Sign in again.");
        return;
      }

      // Govdede yalnizca kupon KODU var; tutarlari sunucu kendisi hesapliyor.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
        body: JSON.stringify(couponCode ? { coupon: couponCode } : {}),
      });
      const data = await res.json();

      if (!res.ok || !data?.url) {
        setCheckoutError(data?.error?.message ?? "Could not start checkout.");
        return;
      }

      window.location.href = data.url as string;
    } catch {
      setCheckoutError("Network error. Try again.");
    } finally {
      setCheckingOut(false);
    }
  }

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

  const shipping = shippingFor(cart.subtotal);

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

            {discount > 0 && (
              <div className="row" style={{ color: "var(--ok)" }}>
                <span>Discount ({couponCode})</span>
                <span data-testid="discount">−{fmt(discount)}</span>
              </div>
            )}

            <div className="coupon">
              {couponCode ? (
                <div className="coupon-applied" data-testid="coupon-applied">
                  <span>
                    {couponEval?.ok
                      ? <>🏷️ <strong>{couponCode}</strong> · {couponEval.label}</>
                      : <>🏷️ <strong>{couponCode}</strong> · <span style={{ color: "var(--danger)" }}>{(couponEval && !couponEval.ok) ? couponEval.message : "not applicable"}</span></>}
                  </span>
                  <button className="btn ghost sm" onClick={removeCoupon}>Remove</button>
                </div>
              ) : (
                <>
                  <div className="coupon-row">
                    <input
                      type="text"
                      placeholder="Discount code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(); }}
                      aria-label="Discount code"
                      data-testid="coupon-input"
                    />
                    <button
                      className="btn ghost sm"
                      onClick={applyCoupon}
                      disabled={!couponInput.trim()}
                      data-testid="coupon-apply"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p style={{ fontSize: 12.5, color: "var(--danger)", margin: "6px 0 0" }}>{couponError}</p>
                  )}
                </>
              )}
            </div>

            <div className="row total">
              <span>Total</span>
              <span data-testid="total">{fmt(Math.max(0, cart.subtotal + shipping - discount))}</span>
            </div>
            <button
              className="btn block"
              style={{ marginTop: 16 }}
              onClick={() => void startCheckout()}
              disabled={busy || checkingOut || cart.lines.length === 0}
              data-testid="checkout"
            >
              {checkingOut ? "Redirecting…" : "Checkout"}
            </button>

            {checkoutError && (
              <div className="alert err" style={{ marginTop: 12 }} data-testid="checkout-error">
                {checkoutError}
              </div>
            )}

            <p style={{ fontSize: 12, color: "var(--faint)", margin: "10px 0 0", textAlign: "center" }}>
              Stripe test mode. Pay with card 4242 4242 4242 4242, any future
              expiry and any CVC. No real money moves.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
