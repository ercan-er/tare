import { listProducts, listBrands, priceBounds } from "@/lib/queries";
import { ok, jsonError, intParam } from "@/lib/api";
import { maybeDelay } from "@/lib/faults";
import type { ProductQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

const SORTS = ["newest", "price_asc", "price_desc", "rating"] as const;

export async function GET(req: Request) {
  await maybeDelay();

  const sp = new URL(req.url).searchParams;
  const sortRaw = sp.get("sort") ?? "newest";
  const sort = (SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as ProductQuery["sort"])
    : "newest";

  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");

  const query: ProductQuery = {
    category: sp.get("category") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    q: sp.get("q")?.trim() || undefined,
    minPrice: minPrice !== null && minPrice !== "" ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== null && maxPrice !== "" ? Number(maxPrice) : undefined,
    inStock: sp.get("inStock") === "true",
    sort,
    page: intParam(sp.get("page"), 1, 1, 10_000),
    perPage: intParam(sp.get("perPage"), 12, 1, 48),
  };

  if (query.minPrice !== undefined && !Number.isFinite(query.minPrice)) {
    return jsonError(400, "invalid_parameter", "minPrice must be a number.");
  }
  if (query.maxPrice !== undefined && !Number.isFinite(query.maxPrice)) {
    return jsonError(400, "invalid_parameter", "maxPrice must be a number.");
  }
  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice
  ) {
    return jsonError(400, "invalid_range", "minPrice cannot be greater than maxPrice.");
  }

  try {
    const [page, brands, bounds] = await Promise.all([
      listProducts(query),
      listBrands(),
      priceBounds(),
    ]);
    return ok({ ...page, facets: { brands, priceRange: bounds }, query });
  } catch (e) {
    return jsonError(500, "internal_error", e instanceof Error ? e.message : "Unexpected error");
  }
}
