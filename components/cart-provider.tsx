"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import { useAuth } from "./auth-provider";
import type { Cart } from "@/lib/types";

const EMPTY: Cart = { lines: [], itemCount: 0, subtotal: 0, currency: "USD" };

type Ctx = {
  cart: Cart;
  busy: boolean;
  error: string | null;
  setLine: (productId: number, quantity: number) => Promise<boolean>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (init: RequestInit): Promise<Response | null> => {
      const t = await token();
      if (!t) return null;
      return fetch("/api/cart", {
        ...init,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${t}`,
          ...(init.headers ?? {}),
        },
      });
    },
    [token]
  );

  const refresh = useCallback(async () => {
    if (!user) { setCart(EMPTY); return; }
    const res = await call({ method: "GET" });
    if (res?.ok) setCart((await res.json()) as Cart);
  }, [user, call]);

  useEffect(() => { void refresh(); }, [refresh]);

  const setLine = useCallback(
    async (productId: number, quantity: number) => {
      setBusy(true);
      setError(null);
      try {
        const res = await call({
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        });
        if (!res) { setError("Sign in to add items to your cart."); return false; }
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error?.message ?? "Could not update the cart.");
          return false;
        }
        setCart(data as Cart);
        return true;
      } catch {
        setError("Network error. Try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [call]
  );

  const clear = useCallback(async () => {
    setBusy(true);
    const res = await call({ method: "DELETE" });
    if (res?.ok) setCart((await res.json()) as Cart);
    setBusy(false);
  }, [call]);

  return (
    <CartCtx.Provider value={{ cart, busy, error, setLine, clear, refresh }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider.");
  return c;
}
