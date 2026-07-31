"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: Props) {
  const list = images.length ? images : [];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const stageRef = useRef<HTMLDivElement | null>(null);

  const src = list[active] ?? null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!src) {
    return (
      <div className="detail-art">
        <div className="gallery-empty">no image</div>
      </div>
    );
  }

  return (
    <div className="gallery" data-testid="product-gallery">
      <div
        ref={stageRef}
        className={`gallery-stage${zoom ? " zoom" : ""}`}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        onClick={() => setZoom((z) => !z)}
        role="img"
        aria-label={alt}
      >
        <img
          src={src}
          alt={alt}
          style={zoom ? { transformOrigin: origin } : undefined}
        />
        <span className="gallery-hint" aria-hidden>{zoom ? "Click to reset" : "Hover to zoom"}</span>
      </div>
      {list.length > 1 && (
        <div className="gallery-thumbs" role="list">
          {list.map((url, i) => (
            <button
              key={url + i}
              type="button"
              className={`gallery-thumb${i === active ? " on" : ""}`}
              onClick={() => { setActive(i); setZoom(false); }}
              aria-label={`Image ${i + 1}`}
              aria-current={i === active}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductInsights({
  purchaseRate,
  topReason,
  alsoBoughtPct,
  alsoBoughtLabel,
}: {
  purchaseRate: number;
  topReason: string;
  alsoBoughtPct: number | null;
  alsoBoughtLabel: string | null;
}) {
  return (
    <div className="insight" data-testid="product-insight">
      <div className="insight-rate">
        <strong>{purchaseRate}%</strong>
        <span>of shoppers who view this go on to buy it</span>
      </div>
      <p className="insight-reason">{topReason}</p>
      {alsoBoughtPct != null && alsoBoughtLabel && (
        <p className="insight-also">
          <strong>{alsoBoughtPct}%</strong> also add {alsoBoughtLabel}
        </p>
      )}
    </div>
  );
}

export function VariantPicker({
  optionName,
  variants,
  selectedId,
  onSelect,
  formatPrice,
  basePrice,
}: {
  optionName: string;
  variants: { id: number; optionValue: string; priceDelta: number; stock: number }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  formatPrice: (cents: number) => string;
  basePrice: number;
}) {
  const label = useMemo(() => optionName || "Option", [optionName]);
  return (
    <div className="variants" data-testid="variant-picker">
      <div className="variants-label">{label}</div>
      <div className="variants-row" role="listbox" aria-label={label}>
        {variants.map((v) => {
          const on = selectedId === v.id;
          const out = v.stock <= 0;
          return (
            <button
              key={v.id}
              type="button"
              role="option"
              aria-selected={on}
              disabled={out}
              className={`variant-opt${on ? " on" : ""}${out ? " out" : ""}`}
              onClick={() => onSelect(v.id)}
            >
              <span className="variant-val">{v.optionValue}</span>
              <span className="variant-meta">
                {out
                  ? "Sold out"
                  : v.priceDelta === 0
                    ? formatPrice(basePrice)
                    : `+${formatPrice(v.priceDelta)}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
