// Son goruntulenen urunler: tamamen istemci tarafinda, localStorage'da.
// Backend yok. Fonksiyonlar yalnizca tarayicida cagrilmalidir.

export type RecentItem = {
  slug: string;
  name: string;
  price: number; // cents
  imageUrl: string | null;
  brand?: string;
};

const KEY = "tare:recent";
const CAP = 12;
export const RECENT_EVENT = "tare:recent-update";

export function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

/** En basa ekler, ayni slug'i tekiller, en fazla CAP tutar. */
export function recordRecent(item: RecentItem): void {
  try {
    const list = readRecent().filter((i) => i.slug !== item.slug);
    list.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)));
    // Ayni sekmedeki dinleyiciler icin (storage event yalnizca diger
    // sekmelerde tetiklenir).
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    /* kota/gizli mod: yok say */
  }
}
