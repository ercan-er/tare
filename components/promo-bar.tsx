"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FIRST_VISIT_CODE, PROMO_WINDOW_MS } from "@/lib/coupons";
import { useToast } from "./toast-provider";

const DISMISS_KEY = "tare:promo-dismissed";
const CLAIM_KEY = "tare:promo-claimed";
const COUPON_KEY = "tare:coupon";
const END_KEY = "tare:promo-ends";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function remaining(end: number) {
  const ms = Math.max(0, end - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { ms, label: `${pad(h)}:${pad(m)}:${pad(s)}` };
}

export function PromoBar() {
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [end, setEnd] = useState(0);
  const [clock, setClock] = useState("00:00:00");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) || localStorage.getItem(CLAIM_KEY)) {
        setReady(true);
        return;
      }
      let ends = Number(localStorage.getItem(END_KEY) || 0);
      if (!ends || ends < Date.now()) {
        ends = Date.now() + PROMO_WINDOW_MS;
        localStorage.setItem(END_KEY, String(ends));
      }
      setEnd(ends);
      setOpen(true);
    } catch {
      setOpen(true);
      setEnd(Date.now() + PROMO_WINDOW_MS);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open || !end) return;
    const tick = () => {
      const r = remaining(end);
      setClock(r.label);
      if (r.ms <= 0) {
        setOpen(false);
        try {
          localStorage.setItem(DISMISS_KEY, "1");
          const saved = localStorage.getItem(COUPON_KEY) || "";
          if (saved.toUpperCase().startsWith("HELLO15")) {
            localStorage.removeItem(COUPON_KEY);
          }
        } catch { /* ignore */ }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, end]);

  if (!ready || !open) return null;

  const claim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/promo/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endsAt: end || Date.now() + PROMO_WINDOW_MS }),
      });
      const data = await res.json();
      if (!res.ok || !data?.code) {
        toast(data?.error?.message ?? "Could not claim offer.", { type: "error" });
        return;
      }
      localStorage.setItem(COUPON_KEY, data.code);
      localStorage.setItem(CLAIM_KEY, "1");
      if (typeof data.expiresAt === "number") {
        localStorage.setItem(END_KEY, String(data.expiresAt));
      }
      try { await navigator.clipboard?.writeText(FIRST_VISIT_CODE); } catch { /* ignore */ }
      setOpen(false);
      toast(`${FIRST_VISIT_CODE} locked in — 15% off, expires with the timer`, {
        type: "success",
        action: { label: "Cart", href: "/cart" },
      });
    } catch {
      toast("Network error. Try again.", { type: "error" });
    } finally {
      setClaiming(false);
    }
  };

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <div className="promo" role="region" aria-label="First visit offer" data-testid="promo-bar">
      <div className="promo-in">
        <span className="promo-msg">
          First visit — <strong>15% off</strong> with{" "}
          <code className="promo-code">{FIRST_VISIT_CODE}</code>
        </span>
        <span className="promo-timer" aria-live="polite">
          ends in <strong>{clock}</strong>
        </span>
        <div className="promo-acts">
          <button
            type="button"
            className="promo-claim"
            onClick={() => void claim()}
            disabled={claiming}
            data-testid="promo-claim"
          >
            {claiming ? "Claiming…" : "Claim code"}
          </button>
          <Link href="/cart" className="promo-link">Use in cart</Link>
          <button type="button" className="promo-x" onClick={dismiss} aria-label="Dismiss">×</button>
        </div>
      </div>
    </div>
  );
}
