import Link from "next/link";

export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <div className="brand" style={{ marginBottom: 10 }}>
              Tare<em>.</em>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, maxWidth: "34ch" }}>
              Grinders, brewers, kettles and scales. The equipment a repeatable cup needs.
            </p>
          </div>
          <div>
            <h5>Shop</h5>
            <Link href="/products">All products</Link>
            <Link href="/products?category=grinders">Grinders</Link>
            <Link href="/products?category=brewers">Brewers</Link>
            <Link href="/products?inStock=true">In stock</Link>
          </div>
          <div>
            <h5>Company</h5>
            <Link href="/contact">Contact</Link>
            <Link href="/products?sort=rating">Top rated</Link>
          </div>
          <div>
            <h5>Technical</h5>
            <Link href="/api/health">Health endpoint</Link>
            <Link href="/api/products">Products API</Link>
            <Link href="/api/categories">Categories API</Link>
          </div>
        </div>
        <div className="ftr-note">
          This storefront is a sample application built as a verification target for
          IronBee. Orders are not real.
        </div>
      </div>
    </footer>
  );
}
