"use client";

import { useEffect } from "react";

/** /sw.js'i kaydeder. Gorsel ciktisi yok. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* kayit basarisiz olursa sessizce gec (ozellik degradasyonu) */
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
