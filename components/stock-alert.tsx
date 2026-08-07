"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "./toast-provider";

type Props = {
  productId: number;
  productName: string;
  mode?: "stock" | "price";
};

export function StockAlert({ productId, productName, mode = "stock" }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = mode === "price" ? "Price drop alert" : "Notify me when available";
  const blurb =
    mode === "price"
      ? "Get an email if this drops in the next 14 days."
      : "Sold out — leave your email and we’ll ping you when it’s back.";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, productId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error?.message ?? "Could not save your alert.");
        return;
      }
      setDone(true);
      toast(`Alert set for ${productName}`, { type: "success" });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="alert-box ok" data-testid="stock-alert-success">
        <strong>You’re on the list</strong>
        <p>We’ll email {email} about {productName}.</p>
      </div>
    );
  }

  return (
    <form className="alert-box" onSubmit={(e) => void submit(e)} data-testid="stock-alert">
      <div className="alert-box-title">{title}</div>
      <p className="alert-box-blurb">{blurb}</p>
      <div className="alert-box-row">
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email for alert"
          data-testid="stock-alert-email"
        />
        <button
          className="btn sm"
          type="submit"
          disabled={busy || !email.trim()}
          data-testid="stock-alert-submit"
        >
          {busy ? "Saving…" : "Notify me"}
        </button>
      </div>
      {error && <div className="alert err" style={{ marginTop: 8 }}>{error}</div>}
    </form>
  );
}
