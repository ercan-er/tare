import Link from "next/link";
import { listCategories, featuredProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { Stories } from "@/components/stories";
import { RecentlyViewed } from "@/components/recently-viewed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    listCategories(),
    featuredProducts(4),
  ]);

  return (
    <>
      <Stories />

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Coffee equipment</span>
            <h1>
              Good coffee is a <em>measurable</em> thing
            </h1>
            <p>
              Grinders, scales, brewers and kettles. We picked the gear that makes
              a cup repeatable and left the rest of it to you.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="btn">
                Browse everything
              </Link>
              <Link href="/products?sort=rating" className="btn ghost">
                Top rated
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <img
              src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=70"
              alt="Coffee equipment laid out on a counter"
            />
          </div>
        </div>
      </section>

      <section className="sec" id="categories">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Categories</span>
              <h2>What are you after</h2>
            </div>
            <Link href="/products">See all</Link>
          </div>

          <div className="cat-grid">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="cat"
                data-testid="category-tile"
              >
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <span className="n">{c.productCount} products</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Featured</span>
              <h2>Rated highest</h2>
            </div>
            <Link href="/products?sort=rating">See the ranking</Link>
          </div>

          {featured.length === 0 ? (
            <div className="empty">
              <h3>No products yet</h3>
              <p>
                Run <code>npm run db:reset</code> to seed the database.
              </p>
            </div>
          ) : (
            <div className="p-grid">
              {featured.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <RecentlyViewed />
    </>
  );
}
