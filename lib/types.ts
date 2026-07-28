export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;          // integer cents, so no floating point rounding drift
  currency: "USD";
  categorySlug: string;
  categoryName: string;
  brand: string;
  rating: number;         // 0–5
  reviewCount: number;
  stock: number;
  imageUrl: string | null;
  tags: string[];
  createdAt: string;      // ISO 8601
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  productCount: number;
};

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  stock: number;
  lineTotal: number;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  currency: "USD";
};

export type ProductQuery = {
  category?: string;
  brand?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort: "newest" | "price_asc" | "price_desc" | "rating";
  page: number;
  perPage: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type ApiError = {
  error: { code: string; message: string };
};
