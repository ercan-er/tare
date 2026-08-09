"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FavCategory = {
  slug: string;
  name: string;
  description?: string;
};

type Ctx = {
  items: FavCategory[];
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (item: FavCategory) => void;
};

const KEY = "tare:fav-categories";
const FavCatCtx = createContext<Ctx | null>(null);

export function FavoriteCategoriesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavCategory[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as FavCategory[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const has = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items],
  );

  const toggle = useCallback((item: FavCategory) => {
    setItems((prev) =>
      prev.some((p) => p.slug === item.slug)
        ? prev.filter((p) => p.slug !== item.slug)
        : [item, ...prev],
    );
  }, []);

  return (
    <FavCatCtx.Provider value={{ items, ready, has, toggle }}>
      {children}
    </FavCatCtx.Provider>
  );
}

export function useFavoriteCategories(): Ctx {
  const c = useContext(FavCatCtx);
  if (!c) throw new Error("useFavoriteCategories must be used inside FavoriteCategoriesProvider.");
  return c;
}

export function CategoryFavoriteButton({
  category,
  className,
}: {
  category: FavCategory;
  className?: string;
}) {
  const { has, toggle } = useFavoriteCategories();
  const active = has(category.slug);

  return (
    <button
      type="button"
      className={`cat-fav${active ? " on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={active}
      aria-label={active ? "Remove favourite category" : "Save favourite category"}
      data-testid="category-fav-toggle"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(category);
      }}
    >
      <span aria-hidden>{active ? "★" : "☆"}</span>
    </button>
  );
}

/** Strip of favourited categories — hidden when empty. */
export function FavoriteCategories({
  bare = false,
}: {
  bare?: boolean;
}) {
  const { items, ready } = useFavoriteCategories();

  const list = useMemo(() => items, [items]);
  if (!ready || list.length === 0) return null;

  const inner = (
    <>
      <div className="sec-head">
        <div>
          <span className="eyebrow">Pinned</span>
          <h2>Favourite categories</h2>
        </div>
        <Link href="/wishlist">Favourites</Link>
      </div>
      <div className="fav-cat-grid" data-testid="favorite-categories">
        {list.map((c) => (
          <Link
            key={c.slug}
            href={`/products?category=${c.slug}`}
            className="fav-cat"
            data-testid="favorite-category"
          >
            <CategoryFavoriteButton category={c} />
            <h3>{c.name}</h3>
            {c.description ? <p>{c.description}</p> : null}
            <span className="n">Browse →</span>
          </Link>
        ))}
      </div>
    </>
  );

  if (bare) {
    return (
      <section className="sec fav-cats-sec" style={{ borderBottom: "none", paddingTop: 8 }}>
        {inner}
      </section>
    );
  }

  return (
    <section className="sec fav-cats-sec">
      <div className="wrap">{inner}</div>
    </section>
  );
}
