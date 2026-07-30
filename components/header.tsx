"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";

const LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/contact", label: "Contact" },
];

type Suggestion = { slug: string; name: string; price: number; imageUrl: string | null };

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);

function SearchBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Yazarken oneri getir (debounce + onceki istegi iptal ederek yaris onle).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setLoading(false); return; }

    setLoading(true);
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(term)}&perPage=6`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: Suggestion[] };
        setResults(
          (data.items ?? []).map((p) => ({
            slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl,
          }))
        );
        setActive(-1);
      } catch {
        /* iptal edildi / ag hatasi: yok say */
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => { clearTimeout(id); ctrl.abort(); };
  }, [q]);

  // Disari tiklayinca kapat.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    router.push(href);
  };

  const runSearch = () => {
    const term = q.trim();
    go(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  };

  const showDropdown = open && q.trim().length >= 2;
  const allIndex = results.length; // "Search for …" satiri

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(allIndex, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < results.length) go(`/products/${results[active].slug}`);
      else runSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="search" ref={boxRef}>
      <form onSubmit={(e) => { e.preventDefault(); runSearch(); }} role="search">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products"
          aria-label="Search products"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </form>

      {showDropdown && (
        <div className="ac" role="listbox" data-testid="search-suggestions">
          {results.map((r, i) => (
            <button
              key={r.slug}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`ac-item${i === active ? " active" : ""}`}
              data-testid="search-suggestion"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(`/products/${r.slug}`)}
            >
              <span className="ac-thumb">{r.imageUrl ? <img src={r.imageUrl} alt="" /> : null}</span>
              <span className="ac-name">{r.name}</span>
              <span className="ac-price">{money(r.price)}</span>
            </button>
          ))}

          {!loading && results.length === 0 && (
            <div className="ac-empty">No matches for “{q.trim()}”</div>
          )}

          <button
            type="button"
            className={`ac-all${active === allIndex ? " active" : ""}`}
            onMouseEnter={() => setActive(allIndex)}
            onClick={runSearch}
          >
            Search for “{q.trim()}” →
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const path = usePathname();
  const { user, signOut, loading } = useAuth();
  const { cart } = useCart();
  const { count: wishCount } = useWishlist();

  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Link href="/" className="brand">
          Tare<em>.</em>
        </Link>

        <nav className="nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} data-active={path === l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hdr-right">
          <Suspense fallback={<div className="search" />}>
            <SearchBox />
          </Suspense>

          <Link href="/wishlist" className="icon-btn" aria-label="Favourites" data-active={path === "/wishlist"}>
            <span aria-hidden style={{ fontSize: 15 }}>♥</span>
            {wishCount > 0 && <span className="badge">{wishCount}</span>}
          </Link>

          <Link href="/cart" className="icon-btn" aria-label="Cart">
            Cart
            {cart.itemCount > 0 && <span className="badge">{cart.itemCount}</span>}
          </Link>

          {loading ? (
            <span style={{ width: 92 }} />
          ) : user ? (
            <>
              <Link href="/account" className="icon-btn" data-active={path === "/account"}>
                Account
              </Link>
              <button className="icon-btn" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
