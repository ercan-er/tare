import { getOrderById, getOrderBySession, listOrders } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

/**
 * session_id verilirse o oturuma ait siparisi, id verilirse o siparisi,
 * hicbiri verilmezse kullanicinin siparis listesini doner. Her sorgu uid
 * ile sinirlidir.
 */
export async function GET(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;

  const params = new URL(req.url).searchParams;
  const sessionId = params.get("session_id");
  const idParam = params.get("id");

  if (sessionId) {
    const order = await getOrderBySession(sessionId, user.uid);
    if (!order) {
      return jsonError(404, "not_found", "No order matches that checkout session.");
    }
    return ok(order);
  }

  if (idParam) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return jsonError(400, "invalid_id", "Order id must be a positive integer.");
    }
    const order = await getOrderById(id, user.uid);
    if (!order) {
      return jsonError(404, "not_found", "No order matches that id.");
    }
    return ok(order);
  }

  return ok({ items: await listOrders(user.uid) });
}
