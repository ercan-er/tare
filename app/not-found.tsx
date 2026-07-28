import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: "90px 0" }}>
      <div className="empty">
        <h3>That page does not exist</h3>
        <p>The link may be stale, or the product may have been removed.</p>
        <Link href="/products" className="btn" style={{ marginTop: 16 }}>
          Back to products
        </Link>
      </div>
    </div>
  );
}
