import { listReviews, productExists, upsertReview } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

const BODY_MAX = 1000;

/** Bir urunun yorumlarini doner. Herkese acik. */
export async function GET(req: Request) {
  const idParam = new URL(req.url).searchParams.get("productId");
  const productId = Number(idParam);
  if (!Number.isInteger(productId) || productId <= 0) {
    return jsonError(400, "invalid_product", "productId must be a positive integer.");
  }
  return ok({ items: await listReviews(productId) });
}

/**
 * Yorum ekler/gunceller. Oturum gerektirir; tutar gibi kritik olmasa da
 * yorumun bir kimlige bagli olmasi ve kullanici basina tek olmasi icin.
 */
export async function POST(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const { productId, rating, body } = (payload ?? {}) as {
    productId?: unknown; rating?: unknown; body?: unknown;
  };

  const pid = Number(productId);
  if (!Number.isInteger(pid) || pid <= 0) {
    return jsonError(400, "invalid_product", "productId must be a positive integer.");
  }

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return jsonError(422, "invalid_rating", "rating must be an integer from 1 to 5.");
  }

  const text = typeof body === "string" ? body.trim() : "";
  if (text.length === 0) {
    return jsonError(422, "empty_body", "Review text cannot be empty.");
  }
  if (text.length > BODY_MAX) {
    return jsonError(422, "body_too_long", `Review text cannot exceed ${BODY_MAX} characters.`);
  }

  if (!(await productExists(pid))) {
    return jsonError(404, "not_found", "No product matches that id.");
  }

  const author = user.email ? user.email.split("@")[0] : "Anonymous";
  const review = await upsertReview({
    productId: pid,
    uid: user.uid,
    author,
    rating: r,
    body: text,
  });

  return ok(review, { status: 201 });
}
