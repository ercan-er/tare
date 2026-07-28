import Link from "next/link";
import type { Metadata } from "next";
import {
  listProducts,
  listCategories,
  listBrands,
  priceBounds,
} from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { Filters } from "@/components/filters";
import type { ProductQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop" };

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

function num(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const SORT_LABEL: Record<ProductQuery["sort"], string> = {
  newest: "Newest",
  price_asc: "Price, low to high",
  price_desc: "Price, high to low",
  rating: "Rating",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const sortRaw = one(sp.sort) ?? "newest";
  const sort = (["newest", "price_asc", "price_desc", "rating"] as const).includes(
    sortRaw as ProductQuery["sort"]
  )
    ? (sortRaw as ProductQuery["sort"])
    : "newest";

  const query: ProductQuery = {
    category: one(sp.category),
    brand: one(sp.brand),
    q: one(sp.q)?.trim() || undefined,
    minPrice: num(one(sp.minPrice)),
    maxPrice: num(one(sp.maxPrice)),
    inStock: one(sp.inStock) === "true",
    sort,
    page: Math.max(1, num(one(sp.page)) ?? 1),
    perPage: 12,
  };

  const [result, categories, brands, bounds] = await Promise.all([
    listProducts(query),
    listCategories(),
    listBrands(),
    priceBounds(),
  ]);

  const active: { key: string; label: string }[] = [];
  if (query.q) active.push({ key: "q", label: `"${query.q}"` });
  if (query.category)
    active.push({
      key: "category",
      label: categories.find((c) => c.slug === query.category)?.name ?? query.category,
    });
  if (query.brand) active.push({ key: "brand", label: query.brand });
  if (query.inStock) active.push({ key: "inStock", label: "In stock" });
  if (query.minPrice !== undefined)
    active.push({ key: "minPrice", label: `from $${Math.round(query.minPrice / 100)}` });
  if (query.maxPrice !== undefined)
    active.push({ key: "maxPrice", label: `up to $${Math.round(query.maxPrice / 100)}` });

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      category: query.category,
      brand: query.brand,
      q: query.q,
      minPrice: query.minPrice?.toString(),
      maxPrice: query.maxPrice?.toString(),
      inStock: query.inStock ? "true" : undefined,
      sort: query.sort !== "newest" ? query.sort : undefined,
      page: query.page > 1 ? String(query.page) : undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">Home</Link> · Shop
      </div>

      <div className="shop">
        <Filters
          categories={categories}
          brands={brands}
          bounds={bounds}
          query={query}
        />

        <div>
          <div className="shop-head">
            <span className="count" data-testid="result-count">
              {result.total} products
              {result.totalPages > 1 && ` · page ${result.page} of ${result.totalPages}`}
            </span>

            <form>
              {Object.entries({
                category: query.category,
                brand: query.brand,
                q: query.q,
                minPrice: query.minPrice?.toString(),
                maxPrice: query.maxPrice?.toString(),
                inStock: query.inStock ? "true" : undefined,
              }).map(([k, v]) =>
                v ? <input key={k} type="hidden" name={k} value={v} /> : null
              )}
              <label style={{ fontSize: 14, color: "var(--muted)", marginRight: 8 }}>
                Sort
              </label>
              <select name="sort" defaultValue={query.sort} data-testid="sort">
                {(Object.keys(SORT_LABEL) as ProductQuery["sort"][]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABEL[s]}
                  </option>
                ))}
              </select>
              <button className="btn ghost sm" style={{ marginLeft: 8 }} type="submit">
                Apply
              </button>
            </form>
          </div>

          {active.length > 0 && (
            <div className="chips">
              {active.map((a) => (
                <span className="chip" key={a.key}>
                  {a.label}
                  <Link href={qs({ [a.key]: undefined, page: undefined })} aria-label="Remove filter">
                    <button type="button">✕</button>
                  </Link>
                </span>
              ))}
              <Link href="/products" className="chip" style={{ borderStyle: "dashed" }}>
                Clear all
              </Link>
            </div>
          )}

          {result.items.length === 0 ? (
            <div className="empty" data-testid="empty-state">
              <h3>No results</h3>
              <p>Try loosening the filters or clearing the search.</p>
              <Link href="/products" className="btn ghost sm" style={{ marginTop: 14 }}>
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="p-grid">
              {result.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <Link
                href={qs({ page: String(Math.max(1, result.page - 1)) })}
                className={result.page <= 1 ? "off" : ""}
              >
                ‹
              </Link>
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={qs({ page: n > 1 ? String(n) : undefined })}
                  className={n === result.page ? "on" : ""}
                >
                  {n}
                </Link>
              ))}
              <Link
                href={qs({ page: String(Math.min(result.totalPages, result.page + 1)) })}
                className={result.page >= result.totalPages ? "off" : ""}
              >
                ›
              </Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
