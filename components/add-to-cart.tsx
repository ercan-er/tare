"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useToast } from "./toast-provider";
import { trackAddToCart } from "@/lib/metrics";

type Props = {
  productId: number;
  stock: number;
  name: string;
  price: number;
  brand: string;
  category: string;
};

export function AddToCart({ productId, stock, name, price, brand, category }: Props) {
  const { user } = useAuth();
  const { setLine, cart, busy, error } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  const inCart = cart.lines.find((l) => l.productId === productId)?.quantity ?? 0;
  const out = stock <= 0;

  if (out) {
    return <div className="alert err" style={{ maxWidth: 420 }}>This product is currently sold out.</div>;
  }

  if (!user) {
    return (
      <div className="alert info" style={{ maxWidth: 420 }}>
        <Link href="/login" style={{ textDecoration: "underline" }}>Sign in</Link> to add items to your cart.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div className="qty">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
          <span data-testid="qty">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            aria-label="Increase"
            disabled={qty >= stock}
          >
            +
          </button>
        </div>

        <button
          className="btn"
          disabled={busy}
          data-testid="add-to-cart"
          onClick={async () => {
            const okAdd = await setLine(productId, inCart + qty);
            if (okAdd) {
              void trackAddToCart(
                { id: productId, name, price, brand, category },
                qty
              );
              toast(`${qty} × ${name} added to cart`, {
                type: "success",
                action: { label: "View cart", href: "/cart" },
              });
            }
          }}
        >
          {busy ? "Adding…" : "Add to cart"}
        </button>
      </div>

      {inCart > 0 && (
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
          {inCart} in your cart. <Link href="/cart" style={{ textDecoration: "underline" }}>View cart</Link>
        </p>
      )}
      {error && <div className="alert err" style={{ maxWidth: 420 }}>{error}</div>}
    </div>
  );
}
