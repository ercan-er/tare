// Sahte kargo takibi. Gercek bir tasiyici yok; asama, siparisin odendigi
// andan itibaren gecen sureye gore hesaplaniyor ve toplam 5 dakikada
// "teslim edildi"ye ulasiyor. Tamamen sunumsal, deterministik: ayni
// siparis her cihazda ayni asamada gorunur.

export const TRACKING_TOTAL_MS = 5 * 60 * 1000; // 5 dakika

export type TrackingStage = {
  key: string;
  label: string;
  detail: string;
  at: number; // 0..1, toplam surenin hangi noktasinda basladigi
};

export const TRACKING_STAGES: TrackingStage[] = [
  { key: "confirmed", label: "Order confirmed", detail: "We received your order.", at: 0 },
  { key: "packed", label: "Packed", detail: "Your items were packed at the warehouse.", at: 0.2 },
  { key: "shipped", label: "Handed to courier", detail: "The parcel left our facility.", at: 0.45 },
  { key: "out", label: "Out for delivery", detail: "The courier is on the way.", at: 0.75 },
  { key: "delivered", label: "Delivered", detail: "Left at the door. Enjoy.", at: 1 },
];

export type TrackingSnapshot = {
  elapsedMs: number;
  percent: number;        // 0..100
  currentIndex: number;   // TRACKING_STAGES icindeki aktif asama
  delivered: boolean;
  etaMs: number;          // teslimata kalan sure (ms), teslimse 0
};

/**
 * startIso: takibin baslangici (odeme zamani). Gecersizse simdi kabul edilir.
 * now: test edilebilirlik icin disaridan verilebilir.
 */
export function trackingSnapshot(startIso: string | null, now = Date.now()): TrackingSnapshot {
  const start = startIso ? new Date(startIso).getTime() : now;
  const base = Number.isNaN(start) ? now : start;

  const elapsedMs = Math.max(0, now - base);
  const percent = Math.min(100, (elapsedMs / TRACKING_TOTAL_MS) * 100);
  const frac = Math.min(1, elapsedMs / TRACKING_TOTAL_MS);

  let currentIndex = 0;
  for (let i = 0; i < TRACKING_STAGES.length; i++) {
    if (frac >= TRACKING_STAGES[i].at) currentIndex = i;
  }

  const delivered = frac >= 1;
  const etaMs = delivered ? 0 : TRACKING_TOTAL_MS - elapsedMs;

  return { elapsedMs, percent, currentIndex, delivered, etaMs };
}

export function formatEta(ms: number): string {
  if (ms <= 0) return "Delivered";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s left`;
  return `${m}m ${s.toString().padStart(2, "0")}s left`;
}
