import { listCategories } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ categories: await listCategories() });
  } catch (e) {
    return jsonError(500, "internal_error", e instanceof Error ? e.message : "Unexpected error");
  }
}
