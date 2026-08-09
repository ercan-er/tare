"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Trendyol-style live social proof. Numbers are deterministic per product id
 * but gently jitter over time so the strip feels alive — no backend required.
 */
export function LiveSignals({
  productId,
  stock,
  reviewCount,
}: {
  productId: number;
  stock: number;
  reviewCount: number;
}) {
  const seed = useMemo(() => {
    const viewingBase = 3 + (productId * 7) % 14;
    const soldBase = 8 + (productId * 13) % 40;
    const cartBase = 1 + (productId * 3) % 6;
    return { viewingBase, soldBase, cartBase };
  }, [productId]);

  const [viewing, setViewing] = useState(seed.viewingBase);
  const [inCart, setInCart] = useState(seed.cartBase);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setViewing(seed.viewingBase);
    setInCart(seed.cartBase);
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setViewing((v) => {
        const delta = (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 0);
        return Math.max(2, Math.min(28, v + delta));
      });
      setInCart((c) => {
        if (Math.random() > 0.35) return c;
        const delta = Math.random() < 0.55 ? 1 : -1;
        return Math.max(1, Math.min(12, c + delta));
      });
    }, 4200);
    return () => window.clearInterval(id);
  }, [seed]);

  const soldToday = seed.soldBase + (tick % 3);

  return (
    <div className="live" data-testid="live-signals" aria-live="polite">
      <div className="live-row">
        <span className="live-dot" aria-hidden />
        <strong>{viewing}</strong> people viewing this right now
      </div>
      <div className="live-row muted">
        <strong>{soldToday}</strong> sold in the last 24 hours
      </div>
      <div className="live-row muted">
        <strong>{inCart}</strong> have it in their cart
        {stock > 0 && stock <= 8 && (
          <> · <span className="live-hot">only {stock} left</span></>
        )}
      </div>
      {reviewCount > 0 && (
        <div className="live-row faint">
          Based on recent activity · {reviewCount} reviews on record
        </div>
      )}
    </div>
  );
}
