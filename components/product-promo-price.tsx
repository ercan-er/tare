"use client";

import { useEffect, useState } from "react";
import { Price } from "./price";

const COUPON_KEY = "tare:coupon";
const PROMO_PERCENT = 15;

/** Product grid preview when a first-visit promo token is saved locally. */
export function ProductPromoPrice({ cents }: { cents: number }) {
  const [promoOn, setPromoOn] = useState(false);

  useEffect(() => {
    try {
      setPromoOn(Boolean(localStorage.getItem(COUPON_KEY)));
    } catch {
      setPromoOn(false);
    }
  }, []);

  if (!promoOn) return <Price cents={cents} />;

  const discount = Math.round((cents * PROMO_PERCENT) / 100);
  const sale = Math.max(0, cents - discount);
  return (
    <span data-testid="product-promo-price">
      <span style={{ textDecoration: "line-through", color: "var(--faint)", marginRight: 6 }}>
        <Price cents={cents} />
      </span>
      <Price cents={sale} />
    </span>
  );
}
