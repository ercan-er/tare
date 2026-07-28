import { getOrderBySession, listOrders } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

/**
 * session_id verilirse tek siparisi, verilmezse kullanicinin siparis
 * listesini doner. Her iki sorgu da uid ile sinirli.
 */
export async function GET(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;

  const sessionId = new URL(req.url).searchParams.get("session_id");

  if (sessionId) {
    const order = await getOrderBySession(sessionId, user.uid);
    if (!order) {
      return jsonError(404, "not_found", "No order matches that checkout session.");
    }
    return ok(order);
  }

  return ok({ items: await listOrders(user.uid) });
}
