"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/metrics";

type Props = {
  id: number;
  name: string;
  price: number;
  brand: string;
  category: string;
};

/** Fires a GA4 view_item event when a product detail page mounts. */
export function TrackProductView(p: Props) {
  useEffect(() => {
    void trackViewItem(p);
    // Only refire when the product itself changes.
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
