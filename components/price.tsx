"use client";

import { useLocale } from "./locale-provider";

/**
 * Locale'e gore para gosterimi ($ / ₺). Sunucu bilesenleri icinde de
 * kullanilabilir (istemci bileseni olarak gomulur).
 */
export function Price({ cents }: { cents: number }) {
  const { money } = useLocale();
  return <>{money(cents)}</>;
}
