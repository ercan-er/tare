"use client";

import { useWishlist, type WishItem } from "./wishlist-provider";

/**
 * Kalp butonu. Bir <Link> icinde de kullanilabilsin diye tiklamada
 * navigasyonu ve ust tiklama olaylarini durdurur.
 */
export function WishlistButton({
  item,
  className,
}: {
  item: WishItem;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const active = has(item.slug);

  return (
    <button
      type="button"
      className={`wish-btn${active ? " on" : ""}${className ? " " + className : ""}`}
      aria-pressed={active}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      data-testid="wishlist-toggle"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
    </button>
  );
}
