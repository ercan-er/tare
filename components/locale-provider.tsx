"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE, LOCALE_KEY, formatMoney, isLocale, translate, type Locale,
} from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  money: (cents: number) => string;
};

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Diskten yukle + <html lang> guncelle.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch { /* yok say */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(LOCALE_KEY, l); } catch { /* yok say */ }
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);
  const money = useCallback((cents: number) => formatMoney(cents, locale), [locale]);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t, money }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale(): Ctx {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error("useLocale must be used inside LocaleProvider.");
  return c;
}
