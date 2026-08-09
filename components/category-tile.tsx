"use client";

import Link from "next/link";
import { CategoryFavoriteButton } from "./favorite-categories";

export function CategoryTile({
  slug,
  name,
  description,
  productCount,
}: {
  slug: string;
  name: string;
  description: string;
  productCount: number;
}) {
  return (
    <Link
      href={`/products?category=${slug}`}
      className="cat"
      data-testid="category-tile"
    >
      <CategoryFavoriteButton
        category={{ slug, name, description }}
        className="on-cat"
      />
      <h3>{name}</h3>
      <p>{description}</p>
      <span className="n">{productCount} products</span>
    </Link>
  );
}
