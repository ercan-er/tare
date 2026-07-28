import { saveMessage } from "@/lib/queries";
import { ok, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body is not valid JSON.");
  }

  const b = body as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim();
  const subject = String(b.subject ?? "").trim();
  const message = String(b.message ?? "").trim();

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Name must be at least 2 characters.";
  if (!EMAIL.test(email)) fields.email = "A valid email address is required.";
  if (subject.length < 3) fields.subject = "Subject must be at least 3 characters.";
  if (message.length < 10) fields.message = "Message must be at least 10 characters.";

  if (Object.keys(fields).length > 0) {
    return Response.json(
      { error: { code: "validation_failed", message: "Some fields need attention.", fields } },
      { status: 422 }
    );
  }

  try {
    const id = await saveMessage({ name, email, subject, body: message });
    return ok({ id, received: true }, { status: 201 });
  } catch (e) {
    return jsonError(500, "internal_error", e instanceof Error ? e.message : "Unexpected error");
  }
}
