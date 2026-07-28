import { getProduct, relatedProducts } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";
import { isFault } from "@/lib/faults";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  if (isFault("error")) {
    return jsonError(500, "injected_fault", "Injected fault: FAULT_INJECT=error");
  }

  try {
    const product = await getProduct(slug);
    if (!product) {
      return jsonError(404, "not_found", `Product not found: ${slug}`);
    }
    const related = await relatedProducts(product.categorySlug, product.id);
    return ok({ product, related });
  } catch (e) {
    return jsonError(500, "internal_error", e instanceof Error ? e.message : "Unexpected error");
  }
}
