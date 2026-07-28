import "server-only";
import { db } from "./db";
import { isFault } from "./faults";
import type {
  Cart,
  CartLine,
  Category,
  Paginated,
  Product,
  ProductQuery,
} from "./types";

type Row = Record<string, unknown>;

function toProduct(r: Row): Product {
  const stock = Number(r.stock);
  return {
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
    // contract fault: return a string where a number is expected
    price: (isFault("contract") ? String(r.price) : Number(r.price)) as number,
    currency: "USD",
    categorySlug: String(r.category_slug),
    categoryName: String(r.category_name ?? ""),
    brand: String(r.brand),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    // stock fault: leak a negative stock value
    stock: isFault("stock") ? -Math.abs(stock) : stock,
    imageUrl: r.image_url ? String(r.image_url) : null,
    tags: String(r.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    createdAt: String(r.created_at),
  };
}

export async function listCategories(): Promise<Category[]> {
  const res = await db().execute(`
    SELECT c.slug, c.name, c.description,
           COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_slug = c.slug
     GROUP BY c.slug
     ORDER BY c.sort_order
  `);

  return res.rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
    productCount: Number(r.product_count),
  }));
}

export async function listBrands(): Promise<string[]> {
  const res = await db().execute(
    "SELECT DISTINCT brand FROM products ORDER BY brand"
  );
  return res.rows.map((r) => String(r.brand));
}

export async function priceBounds(): Promise<{ min: number; max: number }> {
  const res = await db().execute(
    "SELECT MIN(price) AS lo, MAX(price) AS hi FROM products"
  );
  const r = res.rows[0];
  return { min: Number(r?.lo ?? 0), max: Number(r?.hi ?? 0) };
}

const SORTS: Record<ProductQuery["sort"], string> = {
  newest: "p.created_at DESC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
  rating: "p.rating DESC, p.review_count DESC",
};

export async function listProducts(
  q: ProductQuery
): Promise<Paginated<Product>> {
  if (isFault("empty")) {
    return { items: [], page: q.page, perPage: q.perPage, total: 0, totalPages: 0 };
  }

  const where: string[] = [];
  const args: (string | number)[] = [];

  if (q.category) {
    where.push("p.category_slug = ?");
    args.push(q.category);
  }
  if (q.brand) {
    where.push("p.brand = ?");
    args.push(q.brand);
  }
  if (q.q) {
    where.push("(p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)");
    const like = `%${q.q}%`;
    args.push(like, like, like);
  }
  if (typeof q.minPrice === "number") {
    where.push("p.price >= ?");
    args.push(q.minPrice);
  }
  if (typeof q.maxPrice === "number") {
    where.push("p.price <= ?");
    args.push(q.maxPrice);
  }
  if (q.inStock) where.push("p.stock > 0");

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await db().execute({
    sql: `SELECT COUNT(*) AS n FROM products p ${clause}`,
    args,
  });
  const total = Number(countRes.rows[0]?.n ?? 0);

  const offset = (q.page - 1) * q.perPage;
  const res = await db().execute({
    sql: `
      SELECT p.*, c.name AS category_name
        FROM products p
        JOIN categories c ON c.slug = p.category_slug
        ${clause}
       ORDER BY ${SORTS[q.sort]}
       LIMIT ? OFFSET ?`,
    args: [...args, q.perPage, offset],
  });

  return {
    items: res.rows.map(toProduct),
    page: q.page,
    perPage: q.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.perPage)),
  };
}

export async function getProduct(slug: string): Promise<Product | null> {
  const res = await db().execute({
    sql: `SELECT p.*, c.name AS category_name
            FROM products p
            JOIN categories c ON c.slug = p.category_slug
           WHERE p.slug = ?`,
    args: [slug],
  });
  const row = res.rows[0];
  return row ? toProduct(row) : null;
}

export async function relatedProducts(
  categorySlug: string,
  excludeId: number,
  limit = 4
): Promise<Product[]> {
  const res = await db().execute({
    sql: `SELECT p.*, c.name AS category_name
            FROM products p
            JOIN categories c ON c.slug = p.category_slug
           WHERE p.category_slug = ? AND p.id != ?
           ORDER BY p.rating DESC
           LIMIT ?`,
    args: [categorySlug, excludeId, limit],
  });
  return res.rows.map(toProduct);
}

export async function featuredProducts(limit = 4): Promise<Product[]> {
  const res = await db().execute({
    sql: `SELECT p.*, c.name AS category_name
            FROM products p
            JOIN categories c ON c.slug = p.category_slug
           WHERE p.stock > 0
           ORDER BY p.rating DESC, p.review_count DESC
           LIMIT ?`,
    args: [limit],
  });
  return res.rows.map(toProduct);
}

/* ─────────────────────────── cart ─────────────────────────── */

export async function getCart(uid: string): Promise<Cart> {
  const res = await db().execute({
    sql: `SELECT cl.product_id, cl.quantity,
                 p.slug, p.name, p.price, p.image_url, p.stock
            FROM cart_lines cl
            JOIN products p ON p.id = cl.product_id
           WHERE cl.uid = ?
           ORDER BY cl.updated_at DESC`,
    args: [uid],
  });

  const lines: CartLine[] = res.rows.map((r) => {
    const price = Number(r.price);
    const quantity = Number(r.quantity);
    return {
      productId: Number(r.product_id),
      slug: String(r.slug),
      name: String(r.name),
      price,
      quantity,
      imageUrl: r.image_url ? String(r.image_url) : null,
      stock: Number(r.stock),
      lineTotal: price * quantity,
    };
  });

  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
    currency: "USD",
  };
}

export type CartResult =
  | { ok: true; cart: Cart }
  | { ok: false; code: "not_found" | "out_of_stock"; message: string };

export async function setCartLine(
  uid: string,
  productId: number,
  quantity: number
): Promise<CartResult> {
  const prod = await db().execute({
    sql: "SELECT id, stock, name FROM products WHERE id = ?",
    args: [productId],
  });
  const row = prod.rows[0];
  if (!row) {
    return { ok: false, code: "not_found", message: "Product not found." };
  }

  const stock = Number(row.stock);
  if (quantity > 0 && quantity > stock) {
    return {
      ok: false,
      code: "out_of_stock",
      message:
        stock === 0
          ? "This product is out of stock."
          : `Only ${stock} left in stock.`,
    };
  }

  if (quantity <= 0) {
    await db().execute({
      sql: "DELETE FROM cart_lines WHERE uid = ? AND product_id = ?",
      args: [uid, productId],
    });
  } else {
    await db().execute({
      sql: `INSERT INTO cart_lines (uid, product_id, quantity, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(uid, product_id)
            DO UPDATE SET quantity = excluded.quantity,
                          updated_at = excluded.updated_at`,
      args: [uid, productId, quantity, new Date().toISOString()],
    });
  }

  return { ok: true, cart: await getCart(uid) };
}

export async function clearCart(uid: string): Promise<Cart> {
  await db().execute({ sql: "DELETE FROM cart_lines WHERE uid = ?", args: [uid] });
  return getCart(uid);
}

export async function saveMessage(m: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): Promise<number> {
  const res = await db().execute({
    sql: `INSERT INTO messages (name, email, subject, body, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [m.name, m.email, m.subject, m.body, new Date().toISOString()],
  });
  return Number(res.lastInsertRowid ?? 0);
}
