"use client";

import { useEffect, useState } from "react";
import { useTheme, type Theme } from "./theme-provider";

const ICON: Record<Theme, string> = { system: "🖥", light: "☀", dark: "🌙" };
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  // No-flash script <html>'i ayarlar ama React ilk render'da default 'system'
  // dusunur; mount'a kadar sabit ikon gostererek hydration uyusmazligini onle.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const t = mounted ? theme : "system";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[t]}. Switch to ${LABEL[NEXT[t]]}.`}
      title={`Theme: ${LABEL[t]}`}
      data-testid="theme-toggle"
    >
      <span aria-hidden suppressHydrationWarning>{ICON[t]}</span>
    </button>
  );
}
