"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";

// Favoriler tamamen istemci tarafinda, localStorage'da tutulur. Sepetin
// aksine oturum gerektirmez; giris yapmadan da calisir ve o cihazda kalir.

export type WishItem = {
  slug: string;
  name: string;
  price: number; // cents
  imageUrl: string | null;
  brand?: string;
};

type Ctx = {
  items: WishItem[];
  count: number;
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (item: WishItem) => void;
  remove: (slug: string) => void;
};

const KEY = "tare:wishlist";
const WishCtx = createContext<Ctx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);
  const [ready, setReady] = useState(false);

  // Ilk acilista diskten yukle.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as WishItem[]);
    } catch {
      /* bozuk/erisilemez storage: sessizce bos basla */
    }
    setReady(true);
  }, []);

  // Her degisiklikte geri yaz (ilk yukleme bitmeden yazma).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* kota/gizli mod: yok say */
    }
  }, [items, ready]);

  const has = useCallback((slug: string) => items.some((i) => i.slug === slug), [items]);

  const toggle = useCallback((item: WishItem) => {
    setItems((prev) =>
      prev.some((p) => p.slug === item.slug)
        ? prev.filter((p) => p.slug !== item.slug)
        : [item, ...prev]
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  return (
    <WishCtx.Provider value={{ items, count: items.length, ready, has, toggle, remove }}>
      {children}
    </WishCtx.Provider>
  );
}

export function useWishlist(): Ctx {
  const c = useContext(WishCtx);
  if (!c) throw new Error("useWishlist must be used inside WishlistProvider.");
  return c;
}
