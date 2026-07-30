"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useToast } from "./toast-provider";
import { Price } from "./price";

export type BundleItem = {
  id: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

/**
 * "Sik birlikte alinanlar" — Amazon tarzi paket. Ana urun + ilgili urunler;
 * her biri secilebilir, toplam canli guncellenir, tek tikla secilenler sepete
 * eklenir (stokta olmayanlar secilemez).
 */
export function FrequentlyBoughtTogether({ items }: { items: BundleItem[] }) {
  const { user } = useAuth();
  const { setLine, cart, busy } = useCart();
  const { toast } = useToast();

  const selectable = items.filter((i) => i.stock > 0);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(selectable.map((i) => i.id)),
  );

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = items.filter((i) => selected.has(i.id) && i.stock > 0);
  const total = useMemo(() => chosen.reduce((s, i) => s + i.price, 0), [chosen]);

  const addAll = async () => {
    if (chosen.length === 0) return;
    let added = 0;
    for (const item of chosen) {
      const inCart = cart.lines.find((l) => l.productId === item.id)?.quantity ?? 0;
      const ok = await setLine(item.id, inCart + 1);
      if (ok) added += 1;
    }
    if (added > 0) {
      toast(`${added} ürün sepete eklendi`, {
        type: "success",
        action: { label: "Sepete git", href: "/cart" },
      });
    }
  };

  return (
    <section className="sec fbt" style={{ borderBottom: "none" }}>
      <div className="sec-head">
        <div>
          <span className="eyebrow">Bundle</span>
          <h2>Sık birlikte alınanlar</h2>
        </div>
      </div>

      <div className="fbt-body">
        <div className="fbt-row">
          {items.map((item, idx) => {
            const out = item.stock <= 0;
            const on = selected.has(item.id) && !out;
            return (
              <div className="fbt-node" key={item.id}>
                {idx > 0 && <span className="fbt-plus" aria-hidden>+</span>}
                <label className={`fbt-item${on ? " on" : ""}${out ? " out" : ""}`}>
                  <input
                    type="checkbox"
                    className="fbt-check"
                    checked={on}
                    disabled={out}
                    onChange={() => toggle(item.id)}
                    aria-label={item.name}
                  />
                  <Link href={`/products/${item.slug}`} className="fbt-thumb" tabIndex={-1}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} loading="lazy" />
                    ) : (
                      <span className="ph">no image</span>
                    )}
                  </Link>
                  <span className="fbt-name">{item.name}</span>
                  <span className="fbt-price">
                    {out ? "Tükendi" : <Price cents={item.price} />}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        <div className="fbt-summary">
          <div className="fbt-total">
            <span className="fbt-total-label">
              {chosen.length} ürün toplamı
            </span>
            <strong className="fbt-total-val"><Price cents={total} /></strong>
          </div>
          {user ? (
            <button
              className="btn"
              onClick={() => void addAll()}
              disabled={busy || chosen.length === 0}
              data-testid="fbt-add"
            >
              {busy ? "Ekleniyor…" : `Seçilenleri sepete ekle (${chosen.length})`}
            </button>
          ) : (
            <div className="alert info" style={{ margin: 0 }}>
              Sepete eklemek için{" "}
              <Link href="/login" style={{ textDecoration: "underline" }}>giriş yap</Link>.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
