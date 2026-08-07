"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useToast } from "./toast-provider";
import { useLocale } from "./locale-provider";
import { Price } from "./price";
import { trackAddToCart } from "@/lib/metrics";
import { VariantPicker } from "./product-media";
import type { ProductVariant } from "@/lib/types";

type Props = {
  productId: number;
  stock: number;
  name: string;
  price: number;
  brand: string;
  category: string;
  variants: ProductVariant[];
};

export function AddToCart({
  productId, stock, name, price, brand, category, variants,
}: Props) {
  const { user } = useAuth();
  const { setLine, cart, busy, error } = useCart();
  const { toast } = useToast();
  const { money } = useLocale();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<number | null>(
    () => variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id ?? null,
  );

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const hasVariants = variants.length > 0;
  const unitPrice = price + (selected?.priceDelta ?? 0);
  const avail = hasVariants ? (selected?.stock ?? 0) : stock;
  const out = avail <= 0;

  const inCart = cart.lines.find(
    (l) => l.productId === productId && l.variantId === (variantId ?? 0),
  )?.quantity ?? 0;

  const optionName = useMemo(
    () => variants[0]?.optionName ?? "Option",
    [variants],
  );

  if (!user) {
    return (
      <div className="alert info" style={{ maxWidth: 420 }}>
        <Link href="/login" style={{ textDecoration: "underline" }}>Sign in</Link> to add items to your cart.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {hasVariants && (
        <VariantPicker
          optionName={optionName}
          variants={variants}
          selectedId={variantId}
          onSelect={(id) => { setVariantId(id); setQty(1); }}
          formatPrice={money}
          basePrice={price}
        />
      )}

      <div className="price" data-testid="product-price">
        <Price cents={unitPrice} />
        {selected && selected.priceDelta !== 0 && (
          <span className="price-note">includes option</span>
        )}
      </div>

      <div style={{ fontSize: 14, color: out ? "var(--danger)" : "var(--ok)" }}>
        {out
          ? "Sold out"
          : hasVariants
            ? `${avail} in stock for this option`
            : `${avail} in stock`}
      </div>

      {out ? (
        <div className="alert err" style={{ maxWidth: 420 }}>
          {hasVariants ? "This option is sold out. Pick another." : "This product is currently sold out."}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
            <span data-testid="qty">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(avail, q + 1))}
              aria-label="Increase"
              disabled={qty >= avail}
            >
              +
            </button>
          </div>

          <button
            className="btn"
            disabled={busy || (hasVariants && !variantId)}
            data-testid="add-to-cart"
            onClick={async () => {
              const vid = variantId ?? 0;
              const okAdd = await setLine(productId, inCart + qty, vid);
              if (okAdd) {
                const label = selected
                  ? `${name} — ${selected.optionValue}`
                  : name;
                void trackAddToCart(
                  { id: productId, name: label, price: unitPrice, brand, category },
                  qty,
                );
                toast(`${qty} × ${label} added to cart`, {
                  type: "success",
                  action: { label: "View cart", href: "/cart" },
                });
              }
            }}
          >
            {busy ? "Adding…" : "Add to cart"}
          </button>
        </div>
      )}

      {inCart > 0 && (
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
          {inCart} in your cart. <Link href="/cart" style={{ textDecoration: "underline" }}>View cart</Link>
        </p>
      )}
      {error && <div className="alert err" style={{ maxWidth: 420 }}>{error}</div>}
    </div>
  );
}
