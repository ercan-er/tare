"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** Rolling daily flash deal — ends at next local midnight. */
export function FlashDeal({
  href = "/products?sort=price_asc",
  label = "Today’s flash picks",
}: {
  href?: string;
  label?: string;
}) {
  const end = useMemo(() => {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  }, []);

  const [clock, setClock] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, end - Date.now());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setClock(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  return (
    <div className="flash" data-testid="flash-deal">
      <div className="flash-in">
        <span className="flash-tag">Flash</span>
        <span className="flash-msg">{label}</span>
        <span className="flash-timer" aria-live="polite">
          ends in <strong>{clock}</strong>
        </span>
        <Link href={href} className="flash-link">
          Shop deals →
        </Link>
      </div>
    </div>
  );
}
