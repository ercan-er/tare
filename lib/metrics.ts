"use client";

/**
 * Firebase metrics: Analytics (GA4 events) and Performance Monitoring.
 *
 * Both are loaded dynamically and only in the browser. Neither is allowed to
 * break the page: every entry point degrades to a no-op when the SDK is
 * unsupported, blocked by an extension, or simply not configured.
 *
 * Performance Monitoring works as soon as Firebase is configured.
 * Analytics additionally needs NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, which only
 * exists once Google Analytics is enabled for the web app in the Firebase
 * console. Without it, track() silently does nothing.
 */

import { firebaseApp, firebaseConfigured, analyticsConfigured } from "./firebase-client";

type AnalyticsInstance = import("firebase/analytics").Analytics;

let analytics: AnalyticsInstance | null = null;
let started = false;

export async function startMetrics(): Promise<void> {
  if (started || typeof window === "undefined" || !firebaseConfigured) return;
  started = true;

  // Performance Monitoring: page load, network requests, render timings.
  try {
    const { getPerformance } = await import("firebase/performance");
    getPerformance(firebaseApp());
  } catch {
    // Blocked by an extension or unsupported browser. Not fatal.
  }

  // Analytics: only when a measurement id exists.
  if (!analyticsConfigured) return;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) analytics = getAnalytics(firebaseApp());
  } catch {
    // Same reasoning as above.
  }
}

/** Fire a GA4 event. No-ops when analytics is unavailable. */
export async function track(
  name: string,
  params: Record<string, unknown> = {}
): Promise<void> {
  if (!analytics) return;
  try {
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, name, params);
  } catch {
    // Never let telemetry take the page down.
  }
}

/* ── Typed helpers for the standard GA4 ecommerce events ────────────────── */

type Item = { id: number; name: string; price: number; brand: string; category: string };

const toGaItem = (i: Item) => ({
  item_id: i.id,
  item_name: i.name,
  item_brand: i.brand,
  item_category: i.category,
  price: i.price / 100, // GA4 expects a decimal currency value, not cents
});

export const trackViewItem = (i: Item) =>
  track("view_item", { currency: "USD", value: i.price / 100, items: [toGaItem(i)] });

export const trackAddToCart = (i: Item, quantity: number) =>
  track("add_to_cart", {
    currency: "USD",
    value: (i.price * quantity) / 100,
    items: [{ ...toGaItem(i), quantity }],
  });

export const trackSearch = (searchTerm: string) => track("search", { search_term: searchTerm });

export const trackViewCart = (value: number, itemCount: number) =>
  track("view_cart", { currency: "USD", value: value / 100, item_count: itemCount });
