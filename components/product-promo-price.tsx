"use client";

import { useEffect, useState } from "react";
import { Price } from "./price";

const COUPON_KEY = "tare:coupon";

/**
 * INTENTIONAL DEFECT (promo discount on products):
 * When a promo token is saved, the grid shows "15% off" by rendering
 * Math.round(price * 0.15) as the sale price — i.e. 15% of the price,
 * not price minus 15%. Cart preview uses the correct math; this does not.
 */
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

  const wrongSale = Math.round(cents * 0.15);
  return (
    <span data-testid="product-promo-price">
      <span style={{ textDecoration: "line-through", color: "var(--faint)", marginRight: 6 }}>
        <Price cents={cents} />
      </span>
      <Price cents={wrongSale} />
    </span>
  );
}
