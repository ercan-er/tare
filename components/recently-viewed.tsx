"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  RECENT_EVENT, readRecent, recordRecent, type RecentItem,
} from "@/lib/recent";
import { WishlistButton } from "./wishlist-button";
import { useLocale } from "./locale-provider";

/** Urun detay sayfasinda mount olunca urunu gecmise yazar (gorsel ciktisi yok). */
export function RecordRecentView({ item }: { item: RecentItem }) {
  useEffect(() => {
    recordRecent(item);
    // Sadece slug degisince tekrar yaz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.slug]);
  return null;
}

/** Son goruntulenenler serit. Bos ise hicbir sey render etmez. */
export function RecentlyViewed({
  excludeSlug,
  title = "Recently viewed",
  bare = false, // true: cagiran zaten .wrap iginde (ic wrap eklenmez)
}: {
  excludeSlug?: string;
  title?: string;
  bare?: boolean;
}) {
  const { money: fmt } = useLocale();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readRecent());
    sync();
    window.addEventListener(RECENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const list = items.filter((i) => i.slug !== excludeSlug);
  if (list.length === 0) return null;

  const inner = (
    <>
      <div className="sec-head">
        <div>
          <span className="eyebrow">Your history</span>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="recent-strip" data-testid="recently-viewed">
        {list.map((it) => (
          <div className="recent-card" key={it.slug} data-testid="recent-item">
            <Link href={`/products/${it.slug}`} className="recent-thumb">
              <WishlistButton className="on-card" item={it} />
              {it.imageUrl ? (
                <img src={it.imageUrl} alt={it.name} loading="lazy" />
              ) : (
                <div className="ph">no image</div>
              )}
            </Link>
            <div className="recent-body">
              {it.brand && <span className="p-brand">{it.brand}</span>}
              <Link href={`/products/${it.slug}`} className="recent-name">{it.name}</Link>
              <span className="p-price">{fmt(it.price)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <section className="sec" style={{ borderBottom: "none" }}>
      {bare ? inner : <div className="wrap">{inner}</div>}
    </section>
  );
}
