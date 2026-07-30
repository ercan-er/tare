// Hafif i18n + para birimi. Istemci ve sunucu (Price bileseni istemci) ayni
// fonksiyonlari kullanir. Fiyatlar veritabaninda USD cents; TL gosterimi
// sabit bir demo kuru ile hesaplanir (gercek bir doviz servisi degil).

export type Locale = "en" | "tr";
export const LOCALES: Locale[] = ["en", "tr"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_KEY = "tare:locale";

// Demo kuru: 1 USD = 34 TL. Gercek kur degil, yalnizca gosterim icin.
export const USD_TO_TRY = 34;

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "tr";
}

type Dict = Record<string, string>;

const en: Dict = {
  "nav.shop": "Shop",
  "nav.categories": "Categories",
  "nav.contact": "Contact",
  "act.account": "Account",
  "act.signout": "Sign out",
  "act.signin": "Sign in",
  "act.cart": "Cart",
  "act.favourites": "Favourites",
  "search.placeholder": "Search products",
  "search.for": "Search for",
  "search.nomatch": "No matches for",
};

const tr: Dict = {
  "nav.shop": "Mağaza",
  "nav.categories": "Kategoriler",
  "nav.contact": "İletişim",
  "act.account": "Hesabım",
  "act.signout": "Çıkış yap",
  "act.signin": "Giriş yap",
  "act.cart": "Sepet",
  "act.favourites": "Favoriler",
  "search.placeholder": "Ürün ara",
  "search.for": "Şunu ara",
  "search.nomatch": "Eşleşme yok",
};

const dicts: Record<Locale, Dict> = { en, tr };

export function translate(locale: Locale, key: string): string {
  return dicts[locale][key] ?? dicts.en[key] ?? key;
}

export function formatMoney(cents: number, locale: Locale): string {
  if (locale === "tr") {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency", currency: "TRY", maximumFractionDigits: 0,
    }).format((cents / 100) * USD_TO_TRY);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);
}
