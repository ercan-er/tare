"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";

export type Theme = "system" | "light" | "dark";
type Resolved = "light" | "dark";

const THEME_KEY = "tare:theme";
const ORDER: Theme[] = ["system", "light", "dark"];

function isTheme(v: unknown): v is Theme {
  return v === "system" || v === "light" || v === "dark";
}

function systemDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: Theme): Resolved {
  if (theme === "system") return systemDark() ? "dark" : "light";
  return theme;
}

function apply(resolved: Resolved) {
  document.documentElement.dataset.theme = resolved;
  // Adres cubugu / PWA tema rengini de esitle.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#14100D" : "#FBFAF8");
}

type Ctx = {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  cycle: () => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  // Diskten oku (no-flash script zaten <html>'i ayarladi; burada state'i esitliyoruz).
  useEffect(() => {
    let t: Theme = "system";
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (isTheme(saved)) t = saved;
    } catch { /* yok say */ }
    setThemeState(t);
    const r = resolve(t);
    setResolved(r);
    apply(r);
  }, []);

  // "system" secildiyse OS temasini canli dinle.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r: Resolved = mq.matches ? "dark" : "light";
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* yok say */ }
    const r = resolve(t);
    setResolved(r);
    apply(r);
  }, []);

  const cycle = useCallback(() => {
    setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]);
  }, [theme, setTheme]);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme, cycle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider.");
  return c;
}
