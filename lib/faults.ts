/**
 * Fault injection.
 *
 * This exists to prove a verifier actually catches things. In production
 * FAULT_INJECT stays empty and this module does nothing. To test, set a single
 * value on the preview environment only, then deploy.
 *
 *   slow     → /api/products stalls for 6 seconds   (budget / timeout)
 *   contract → price comes back as a string         (contract violation)
 *   error    → /api/products/[slug] returns 500     (route health)
 *   empty    → product list comes back empty        (silent regression)
 *   stock    → stock comes back negative            (business logic)
 */

export type Fault = "slow" | "contract" | "error" | "empty" | "stock";

export function activeFault(): Fault | null {
  const v = (process.env.FAULT_INJECT || "").trim().toLowerCase();
  const known: Fault[] = ["slow", "contract", "error", "empty", "stock"];
  return (known as string[]).includes(v) ? (v as Fault) : null;
}

export function isFault(f: Fault): boolean {
  return activeFault() === f;
}

export async function maybeDelay(): Promise<void> {
  if (isFault("slow")) await new Promise((r) => setTimeout(r, 6000));
}
