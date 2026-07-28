import { verifyBearer, adminConfigured } from "@/lib/firebase-admin";
import { getCart, setCartLine, clearCart } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

async function requireUser(req: Request) {
  if (!adminConfigured) {
    return {
      user: null,
      response: jsonError(
        503,
        "auth_not_configured",
        "Firebase Admin environment variables are not configured on the server."
      ),
    };
  }
  const user = await verifyBearer(req);
  if (!user) {
    return {
      user: null,
      response: jsonError(401, "unauthorized", "A valid Firebase ID token is required."),
    };
  }
  return { user, response: null };
}

export async function GET(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;
  return ok(await getCart(user.uid));
}

export async function POST(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body is not valid JSON.");
  }

  const b = body as Record<string, unknown>;
  const productId = Number(b.productId);
  const quantity = Number(b.quantity);

  if (!Number.isInteger(productId) || productId <= 0) {
    return jsonError(400, "invalid_parameter", "productId must be a positive integer.");
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return jsonError(400, "invalid_parameter", "quantity must be an integer between 0 and 99.");
  }

  const result = await setCartLine(user.uid, productId, quantity);
  if (!result.ok) {
    return jsonError(result.code === "not_found" ? 404 : 409, result.code, result.message);
  }
  return ok(result.cart);
}

export async function DELETE(req: Request) {
  const { user, response } = await requireUser(req);
  if (!user) return response!;
  return ok(await clearCart(user.uid));
}
