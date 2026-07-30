"use client";

import { useEffect, useState } from "react";
import {
  TRACKING_STAGES,
  formatEta,
  trackingSnapshot,
} from "@/lib/tracking";

/**
 * Sahte kargo takibi kutusu. startIso'dan (odeme zamani) itibaren gecen
 * sureye gore asama gosterir ve 5 dakikada teslime ulasir. Teslim olana
 * kadar saniyede bir kendini tazeler, sonra timer'i durdurur.
 */
export function ShipmentTracker({ startIso }: { startIso: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  const snap = trackingSnapshot(startIso, now);

  useEffect(() => {
    if (snap.delivered) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [snap.delivered]);

  return (
    <div className="track" data-testid="shipment-tracker">
      <div className="track-head">
        <span className="track-title">
          {snap.delivered ? "Delivered" : "On its way"}
        </span>
        <span
          className="track-eta"
          data-testid="shipment-eta"
          data-delivered={snap.delivered}
        >
          {formatEta(snap.etaMs)}
        </span>
      </div>

      <div className="track-bar" role="progressbar" aria-valuenow={Math.round(snap.percent)} aria-valuemin={0} aria-valuemax={100}>
        <span className="track-fill" style={{ width: `${snap.percent}%` }} />
        <span
          className="track-vehicle"
          style={{ left: `${snap.percent}%` }}
          aria-hidden
        >
          {TRACKING_STAGES[snap.currentIndex].icon}
        </span>
      </div>

      <ol className="track-steps">
        {TRACKING_STAGES.map((stage, i) => {
          const done = i < snap.currentIndex || snap.delivered;
          const active = i === snap.currentIndex && !snap.delivered;
          return (
            <li
              key={stage.key}
              data-state={done ? "done" : active ? "active" : "todo"}
            >
              <span className="track-dot" aria-hidden>{stage.icon}</span>
              <div>
                <div className="track-step-label">{stage.label}</div>
                <div className="track-step-detail">{stage.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
