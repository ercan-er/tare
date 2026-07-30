"use client";

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "./locale-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="lang" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-opt${l === locale ? " on" : ""}`}
          aria-pressed={l === locale}
          onClick={() => setLocale(l)}
          data-testid={`lang-${l}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
