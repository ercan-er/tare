import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, relatedProducts } from "@/lib/queries";
import { AddToCart } from "@/components/add-to-cart";
import { Price } from "@/components/price";
import { ProductCard } from "@/components/product-card";
import { Stars } from "@/components/stars";
import { TrackProductView } from "@/components/track-view";
import { RecordRecentView, RecentlyViewed } from "@/components/recently-viewed";
import { ProductReviews } from "@/components/product-reviews";
import { FrequentlyBoughtTogether } from "@/components/frequently-bought";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p
    ? { title: p.name, description: p.description.slice(0, 150) }
    : { title: "Product not found" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await relatedProducts(product.categorySlug, product.id);
  const out = product.stock <= 0;

  return (
    <div className="wrap">
      <TrackProductView
        id={product.id}
        name={product.name}
        price={product.price}
        brand={product.brand}
        category={product.categoryName}
      />
      <RecordRecentView
        item={{
          slug: product.slug,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          brand: product.brand,
        }}
      />
      <div className="crumbs">
        <Link href="/">Home</Link> ·{" "}
        <Link href="/products">Shop</Link> ·{" "}
        <Link href={`/products?category=${product.categorySlug}`}>
          {product.categoryName}
        </Link>
      </div>

      <div className="detail">
        <div className="detail-art">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div
              style={{
                width: "100%", height: "100%", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "var(--faint)", fontSize: 12, letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              no image
            </div>
          )}
        </div>

        <div>
          <span className="eyebrow">{product.brand}</span>
          <h1 data-testid="product-name">{product.name}</h1>

          <div className="p-meta">
            <Stars value={product.rating} />
            <span>{product.rating.toFixed(1)}</span>
            <span style={{ color: "var(--faint)" }}>
              {product.reviewCount} reviews
            </span>
          </div>

          <div className="price" data-testid="product-price"><Price cents={product.price} /></div>
          <div style={{ fontSize: 14, color: out ? "var(--danger)" : "var(--ok)" }}>
            {out ? "Sold out" : `${product.stock} in stock`}
          </div>

          <p className="desc">{product.description}</p>

          <AddToCart
            productId={product.id}
            stock={product.stock}
            name={product.name}
            price={product.price}
            brand={product.brand}
            category={product.categoryName}
          />

          <table className="spec">
            <tbody>
              <tr><td>Brand</td><td>{product.brand}</td></tr>
              <tr><td>Category</td><td>{product.categoryName}</td></tr>
              <tr><td>SKU</td><td>{product.slug}</td></tr>
              <tr>
                <td>Tags</td>
                <td>{product.tags.length ? product.tags.join(", ") : "—"}</td>
              </tr>
              <tr>
                <td>Added</td>
                <td>{new Date(product.createdAt).toLocaleDateString("en-US")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {related.length > 0 && (
        <FrequentlyBoughtTogether
          items={[
            {
              id: product.id, slug: product.slug, name: product.name,
              price: product.price, imageUrl: product.imageUrl, stock: product.stock,
            },
            ...related.slice(0, 2).map((r) => ({
              id: r.id, slug: r.slug, name: r.name,
              price: r.price, imageUrl: r.imageUrl, stock: r.stock,
            })),
          ]}
        />
      )}

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="sec" style={{ borderBottom: "none" }}>
          <div className="sec-head">
            <div>
              <span className="eyebrow">Same category</span>
              <h2>You might also like</h2>
            </div>
          </div>
          <div className="p-grid">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={product.slug} bare />
    </div>
  );
}
