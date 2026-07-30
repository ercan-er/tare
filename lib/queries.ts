import "server-only";
import { db } from "./db";
import { isFault } from "./faults";
import { shippingFor } from "./pricing";
import { evaluateCoupon, isPromoToken } from "./coupons";
import { verifyPromoToken } from "./promo-token";
import type {
  Cart,
  CartLine,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Paginated,
  Product,
  ProductQuery,
  Review,
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

/* ─────────────────────────── orders ─────────────────────────── */

async function itemsOf(orderId: number): Promise<OrderItem[]> {
  const res = await db().execute({
    sql: `SELECT product_id, name, price, quantity
            FROM order_items WHERE order_id = ? ORDER BY id`,
    args: [orderId],
  });

  return res.rows.map((r) => {
    const price = Number(r.price);
    const quantity = Number(r.quantity);
    return {
      productId: Number(r.product_id),
      name: String(r.name),
      price,
      quantity,
      lineTotal: price * quantity,
    };
  });
}

function toOrder(r: Row, items: OrderItem[]): Order {
  return {
    id: Number(r.id),
    status: String(r.status) as OrderStatus,
    email: r.email ? String(r.email) : null,
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    discount: Number(r.discount ?? 0),
    coupon: r.coupon ? String(r.coupon) : null,
    total: Number(r.total),
    currency: "USD",
    createdAt: String(r.created_at),
    paidAt: r.paid_at ? String(r.paid_at) : null,
    items,
  };
}

export type CheckoutResult =
  | { ok: true; order: Order }
  | { ok: false; code: "empty_cart" | "out_of_stock" | "invalid_coupon"; message: string };

/**
 * Sepetten "pending" bir siparis olusturur.
 *
 * Fiyatlar ve kargo burada, veritabanindaki degerlerden hesaplaniyor.
 * Istemcinin gonderdigi hicbir tutara guvenilmiyor; aksi halde tarayici
 * uzerinden 1 cent'e siparis verilebilirdi.
 */
export async function createPendingOrder(
  uid: string,
  email: string | null,
  couponCode?: string | null
): Promise<CheckoutResult> {
  const cart = await getCart(uid);

  if (cart.lines.length === 0) {
    return { ok: false, code: "empty_cart", message: "Your cart is empty." };
  }

  const short = cart.lines.find((l) => l.quantity > l.stock);
  if (short) {
    return {
      ok: false,
      code: "out_of_stock",
      message:
        short.stock === 0
          ? `${short.name} is out of stock.`
          : `Only ${short.stock} left of ${short.name}.`,
    };
  }

  const subtotal = cart.subtotal;
  const shipping = shippingFor(subtotal);

  let discount = 0;
  let coupon: string | null = null;
  if (couponCode && couponCode.trim()) {
    const promoSigValid = isPromoToken(couponCode)
      ? verifyPromoToken(couponCode)
      : undefined;
    const couponRes = evaluateCoupon(couponCode, subtotal, { promoSigValid });
    if (!couponRes.ok) {
      return { ok: false, code: "invalid_coupon", message: couponRes.message };
    }
    if (couponRes.discount > 0) {
      discount = couponRes.discount;
      coupon = couponRes.code;
    }
  }

  const total = subtotal + shipping - discount;
  const now = new Date().toISOString();

  const res = await db().execute({
    sql: `INSERT INTO orders (uid, email, status, subtotal, shipping, discount, coupon, total, currency, created_at)
          VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, 'USD', ?)`,
    args: [uid, email, subtotal, shipping, discount, coupon, total, now],
  });
  const orderId = Number(res.lastInsertRowid ?? 0);

  await db().batch(
    cart.lines.map((l) => ({
      sql: `INSERT INTO order_items (order_id, product_id, name, price, quantity)
            VALUES (?, ?, ?, ?, ?)`,
      args: [orderId, l.productId, l.name, l.price, l.quantity],
    })),
    "write"
  );

  return {
    ok: true,
    order: {
      id: orderId,
      status: "pending",
      email,
      subtotal,
      shipping,
      discount,
      coupon,
      total,
      currency: "USD",
      createdAt: now,
      paidAt: null,
      items: cart.lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
    },
  };
}

export async function setOrderSession(
  orderId: number,
  sessionId: string
): Promise<void> {
  await db().execute({
    sql: "UPDATE orders SET stripe_session_id = ? WHERE id = ?",
    args: [sessionId, orderId],
  });
}

/**
 * Odemeyi onaylar: siparisi "paid" yapar, stogu duser, sepeti bosaltir.
 *
 * Stripe ayni olayi birden fazla kez gonderebiliyor (yeniden deneme, ag
 * hatasi). Bu yuzden gecis `status = 'pending'` sartina bagli: ikinci cagri
 * hicbir satiri guncellemez, `applied: false` doner ve stok bir daha dusmez.
 */
export async function markOrderPaid(
  sessionId: string
): Promise<{ applied: boolean; orderId: number | null }> {
  const upd = await db().execute({
    sql: `UPDATE orders SET status = 'paid', paid_at = ?
           WHERE stripe_session_id = ? AND status = 'pending'`,
    args: [new Date().toISOString(), sessionId],
  });

  const found = await db().execute({
    sql: "SELECT id, uid FROM orders WHERE stripe_session_id = ?",
    args: [sessionId],
  });
  const row = found.rows[0];
  const orderId = row ? Number(row.id) : null;

  if (Number(upd.rowsAffected ?? 0) === 0) {
    return { applied: false, orderId };
  }

  const items = await db().execute({
    sql: "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
    args: [orderId],
  });

  const statements = [
    ...items.rows.map((i) => ({
      // MAX(0, …) yarisan iki siparisin stogu eksiye dusurmesini engelliyor.
      sql: "UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?",
      args: [Number(i.quantity), Number(i.product_id)],
    })),
    { sql: "DELETE FROM cart_lines WHERE uid = ?", args: [String(row!.uid)] },
  ];

  await db().batch(statements, "write");

  return { applied: true, orderId };
}

/**
 * Stripe oturumu suresi dolunca siparisi kapatir.
 *
 * markOrderPaid ile ayni sarta bagli: yalnizca hala "pending" olan siparis
 * iptal edilir. Odenmis bir siparis, gec gelen bir "expired" olayi yuzunden
 * geri alinmaz.
 */
export async function markOrderCancelled(
  sessionId: string
): Promise<{ applied: boolean; orderId: number | null }> {
  const upd = await db().execute({
    sql: `UPDATE orders SET status = 'cancelled'
           WHERE stripe_session_id = ? AND status = 'pending'`,
    args: [sessionId],
  });

  const found = await db().execute({
    sql: "SELECT id FROM orders WHERE stripe_session_id = ?",
    args: [sessionId],
  });

  return {
    applied: Number(upd.rowsAffected ?? 0) > 0,
    orderId: found.rows[0] ? Number(found.rows[0].id) : null,
  };
}

export async function getOrderBySession(
  sessionId: string,
  uid: string
): Promise<Order | null> {
  // uid sarti onemli: aksi halde oturum kimligini bilen bir kullanici
  // baskasinin siparisini goruntuleyebilirdi.
  const res = await db().execute({
    sql: "SELECT * FROM orders WHERE stripe_session_id = ? AND uid = ?",
    args: [sessionId, uid],
  });
  const row = res.rows[0];
  return row ? toOrder(row, await itemsOf(Number(row.id))) : null;
}

export async function getOrderById(
  id: number,
  uid: string
): Promise<Order | null> {
  // uid sarti onemli: baskasinin siparis id'sini tahmin eden biri
  // siparisi goruntuleyememeli.
  const res = await db().execute({
    sql: "SELECT * FROM orders WHERE id = ? AND uid = ?",
    args: [id, uid],
  });
  const row = res.rows[0];
  return row ? toOrder(row, await itemsOf(Number(row.id))) : null;
}

export async function listOrders(uid: string, limit = 25): Promise<Order[]> {
  const res = await db().execute({
    sql: `SELECT * FROM orders WHERE uid = ?
           ORDER BY created_at DESC LIMIT ?`,
    args: [uid, limit],
  });

  const out: Order[] = [];
  for (const row of res.rows) {
    out.push(toOrder(row, await itemsOf(Number(row.id))));
  }
  return out;
}

// ─────────── reviews ───────────

function toReview(r: Row): Review {
  return {
    id: Number(r.id),
    productId: Number(r.product_id),
    author: String(r.author),
    rating: Number(r.rating),
    body: String(r.body),
    createdAt: String(r.created_at),
  };
}

export async function productExists(id: number): Promise<boolean> {
  const res = await db().execute({
    sql: "SELECT 1 FROM products WHERE id = ? LIMIT 1",
    args: [id],
  });
  return res.rows.length > 0;
}

export async function listReviews(productId: number, limit = 50): Promise<Review[]> {
  const res = await db().execute({
    sql: `SELECT * FROM reviews WHERE product_id = ?
           ORDER BY created_at DESC LIMIT ?`,
    args: [productId, limit],
  });
  return res.rows.map(toReview);
}

/**
 * Kullanici basina urun basina tek yorum. Ayni kullanici tekrar gonderirse
 * mevcut yorumu gunceller (uid, product_id benzersiz index'i sayesinde).
 */
export async function upsertReview(input: {
  productId: number;
  uid: string;
  author: string;
  rating: number;
  body: string;
}): Promise<Review> {
  const now = new Date().toISOString();
  await db().execute({
    sql: `INSERT INTO reviews (product_id, uid, author, rating, body, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(uid, product_id)
          DO UPDATE SET rating = excluded.rating,
                        body = excluded.body,
                        author = excluded.author,
                        created_at = excluded.created_at`,
    args: [input.productId, input.uid, input.author, input.rating, input.body, now],
  });

  const res = await db().execute({
    sql: "SELECT * FROM reviews WHERE uid = ? AND product_id = ?",
    args: [input.uid, input.productId],
  });
  return toReview(res.rows[0]);
}
