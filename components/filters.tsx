"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, ProductQuery } from "@/lib/types";

export function Filters({
  categories,
  brands,
  bounds,
  query,
}: {
  categories: Category[];
  brands: string[];
  bounds: { min: number; max: number };
  query: ProductQuery;
}) {
  const router = useRouter();
  const [minLira, setMinLira] = useState(
    query.minPrice !== undefined ? String(Math.round(query.minPrice / 100)) : ""
  );
  const [maxLira, setMaxLira] = useState(
    query.maxPrice !== undefined ? String(Math.round(query.maxPrice / 100)) : ""
  );

  const go = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: query.category,
      brand: query.brand,
      q: query.q,
      minPrice: query.minPrice?.toString(),
      maxPrice: query.maxPrice?.toString(),
      inStock: query.inStock ? "true" : undefined,
      sort: query.sort !== "newest" ? query.sort : undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    router.push(s ? `/products?${s}` : "/products");
  };

  return (
    <aside className="filters" data-testid="filters">
      <div className="f-block">
        <h4>Category</h4>
        <label className="f-opt">
          <input
            type="radio"
            name="category"
            checked={!query.category}
            onChange={() => go({ category: undefined })}
          />
          All
        </label>
        {categories.map((c) => (
          <label className="f-opt" key={c.slug}>
            <input
              type="radio"
              name="category"
              checked={query.category === c.slug}
              onChange={() => go({ category: c.slug })}
            />
            {c.name}
            <span className="n">{c.productCount}</span>
          </label>
        ))}
      </div>

      <div className="f-block">
        <h4>Brand</h4>
        <label className="f-opt">
          <input
            type="radio"
            name="brand"
            checked={!query.brand}
            onChange={() => go({ brand: undefined })}
          />
          All
        </label>
        {brands.map((b) => (
          <label className="f-opt" key={b}>
            <input
              type="radio"
              name="brand"
              checked={query.brand === b}
              onChange={() => go({ brand: b })}
            />
            {b}
          </label>
        ))}
      </div>

      <div className="f-block">
        <h4>Price range ($)</h4>
        <div className="f-row">
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(Math.floor(bounds.min / 100))}
            value={minLira}
            onChange={(e) => setMinLira(e.target.value)}
            aria-label="Minimum price"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(Math.ceil(bounds.max / 100))}
            value={maxLira}
            onChange={(e) => setMaxLira(e.target.value)}
            aria-label="Maximum price"
          />
        </div>
        <button
          className="btn ghost sm block"
          style={{ marginTop: 10 }}
          data-testid="apply-price"
          onClick={() =>
            go({
              minPrice: minLira ? String(Number(minLira) * 100) : undefined,
              maxPrice: maxLira ? String(Number(maxLira) * 100) : undefined,
            })
          }
        >
          Apply price
        </button>
      </div>

      <div className="f-block">
        <h4>Availability</h4>
        <label className="f-opt">
          <input
            type="checkbox"
            checked={query.inStock}
            onChange={(e) => go({ inStock: e.target.checked ? "true" : undefined })}
          />
          In stock only
        </label>
      </div>
    </aside>
  );
}
