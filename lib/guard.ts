import "server-only";
import { verifyBearer, adminConfigured, type AuthedUser } from "./firebase-admin";
import { jsonError } from "./api";

/**
 * Korumali rotalarin ortak girisi.
 *
 * 503 ile 401'i ayirmak onemli: 503 "sunucu yapilandirilmamis" demek ve
 * kullanicinin yapabilecegi bir sey yok; 401 "gecerli token gonder" demek.
 * Ikisini ayni yanitla karistirmak, eksik ortam degiskenini gunlerce
 * "kullanici giris yapmamis" sanmaya yol aciyor.
 */
export async function requireUser(
  req: Request
): Promise<
  { user: AuthedUser; response: null } | { user: null; response: Response }
> {
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
      response: jsonError(
        401,
        "unauthorized",
        "A valid Firebase ID token is required."
      ),
    };
  }

  return { user, response: null };
}
