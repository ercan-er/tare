"use client";

import Link from "next/link";
import { useWishlist } from "@/components/wishlist-provider";
import { WishlistButton } from "@/components/wishlist-button";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

export default function WishlistPage() {
  const { items, ready } = useWishlist();

  if (!ready) {
    return (
      <div className="wrap" style={{ padding: "60px 0" }}>
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "0 0 90px" }}>
      <div className="crumbs"><Link href="/">Home</Link> · Favourites</div>

      <div className="sec-head" style={{ marginBottom: 14 }}>
        <div>
          <span className="eyebrow">Saved</span>
          <h1 className="serif" style={{ fontSize: 34, margin: "6px 0 0", letterSpacing: "-.015em" }}>
            Your favourites
          </h1>
        </div>
        {items.length > 0 && <Link href="/products">Keep browsing</Link>}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h3>No favourites yet</h3>
          <p>Tap the heart on any product to save it here.</p>
          <Link href="/products" className="btn" style={{ marginTop: 16 }}>Browse products</Link>
        </div>
      ) : (
        <div className="p-grid" data-testid="wishlist-grid">
          {items.map((it) => (
            <div className="p-card" key={it.slug} data-testid="wishlist-item">
              <Link href={`/products/${it.slug}`} className="p-thumb" style={{ display: "block" }}>
                <WishlistButton className="on-card" item={it} />
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.name} loading="lazy" />
                ) : (
                  <div className="ph">no image</div>
                )}
              </Link>
              <div className="p-body">
                {it.brand && <span className="p-brand">{it.brand}</span>}
                <h3 className="p-name">
                  <Link href={`/products/${it.slug}`}>{it.name}</Link>
                </h3>
                <div className="p-foot">
                  <span className="p-price">{fmt(it.price)}</span>
                  <Link href={`/products/${it.slug}`} style={{ fontSize: 13, color: "var(--brass)" }}>
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
