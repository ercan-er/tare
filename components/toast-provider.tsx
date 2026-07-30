"use client";

import Link from "next/link";
import {
  createContext, useCallback, useContext, useRef, useState, type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastInput = {
  type?: ToastType;
  action?: { label: string; href: string };
  duration?: number; // ms
};

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  action?: { label: string; href: string };
};

type Ctx = {
  toast: (message: string, opts?: ToastInput) => void;
};

const ToastCtx = createContext<Ctx | null>(null);
const MAX = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, opts?: ToastInput) => {
      const id = ++idRef.current;
      const t: Toast = {
        id,
        message,
        type: opts?.type ?? "info",
        action: opts?.action,
      };
      setItems((prev) => [...prev, t].slice(-MAX));
      const duration = opts?.duration ?? 3200;
      window.setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap" role="region" aria-live="polite" aria-label="Notifications">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role="status" data-testid="toast">
            <span className="toast-msg">{t.message}</span>
            {t.action && (
              <Link href={t.action.href} className="toast-action" onClick={() => remove(t.id)}>
                {t.action.label}
              </Link>
            )}
            <button className="toast-x" aria-label="Dismiss" onClick={() => remove(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast must be used inside ToastProvider.");
  return c;
}
