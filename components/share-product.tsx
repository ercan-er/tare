"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";

export function ShareProduct({ name }: { name: string }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `Check out ${name} on Tare`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied", { type: "success" });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied", { type: "success" });
      } catch {
        toast("Could not share", { type: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="share-btn"
      onClick={() => void share()}
      disabled={busy}
      data-testid="share-product"
    >
      Share
    </button>
  );
}
