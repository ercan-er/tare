import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/db";
import { Stars } from "./stars";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ p }: { p: Product }) {
  const out = p.stock <= 0;
  const low = !out && p.stock <= 10;

  return (
    <Link href={`/products/${p.slug}`} className="p-card" data-testid="product-card">
      <div className="p-thumb">
        {out && <span className="p-flag out">Sold out</span>}
        {low && <span className="p-flag low">{p.stock} left</span>}
        <WishlistButton
          className="on-card"
          item={{ slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl, brand: p.brand }}
        />
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" />
        ) : (
          <div className="ph">no image</div>
        )}
      </div>
      <div className="p-body">
        <span className="p-brand">{p.brand}</span>
        <h3 className="p-name">{p.name}</h3>
        <div className="p-meta">
          <Stars value={p.rating} />
          <span>{p.rating.toFixed(1)}</span>
          <span style={{ color: "var(--faint)" }}>({p.reviewCount})</span>
        </div>
        <div className="p-foot">
          <span className="p-price" data-testid="price">{formatPrice(p.price)}</span>
          <span style={{ fontSize: 12.5, color: out ? "var(--danger)" : "var(--ok)" }}>
            {out ? "Out of stock" : "In stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
