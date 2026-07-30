"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";

const LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/contact", label: "Contact" },
];

function SearchBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
      }}
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products"
        aria-label="Search products"
      />
    </form>
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
