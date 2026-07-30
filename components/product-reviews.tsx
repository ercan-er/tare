"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { useToast } from "./toast-provider";
import type { Review } from "@/lib/types";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function StaticStars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {"★".repeat(full)}
      <span style={{ color: "var(--line)" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}

function StarInput({
  value, onChange, disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="star-input" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          className={`star-pick${n <= shown ? " on" : ""}`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value === n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: number }) {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { items: Review[] };
          setReviews(data.items ?? []);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  const mine = user ? reviews.find((r) => r.author === (user.email?.split("@")[0] ?? "")) : undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) { setError("Pick a star rating first."); return; }
    if (body.trim().length === 0) { setError("Write a few words about it."); return; }

    setBusy(true);
    try {
      const t = await token();
      if (!t) { setError("Your session expired. Sign in again."); return; }
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
        body: JSON.stringify({ productId, rating, body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not post your review.");
        return;
      }
      const saved = data as Review;
      setReviews((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      setBody("");
      setRating(0);
      toast("Thanks for your review!", { type: "success" });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sec reviews" style={{ borderBottom: "none" }}>
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">Reviews</span>
          <h2>What buyers say</h2>
        </div>
      </div>

      {user ? (
        <form className="review-form" onSubmit={submit}>
          <div className="review-form-row">
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {mine ? "Update your review" : "Your rating"}
            </span>
            <StarInput value={rating || mine?.rating || 0} onChange={setRating} disabled={busy} />
          </div>
          <textarea
            className="review-text"
            placeholder="How did it work out for you?"
            value={body}
            maxLength={1000}
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
            data-testid="review-body"
          />
          {error && <div className="alert err" style={{ marginTop: 4 }}>{error}</div>}
          <button className="btn" type="submit" disabled={busy} data-testid="review-submit">
            {busy ? "Posting…" : mine ? "Update review" : "Post review"}
          </button>
        </form>
      ) : (
        <div className="alert info" style={{ maxWidth: 460, marginBottom: 24 }}>
          <Link href="/login" style={{ textDecoration: "underline" }}>Sign in</Link> to leave a review.
        </div>
      )}

      {loaded && reviews.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No reviews yet — be the first.</p>
      ) : (
        <div className="review-list" data-testid="review-list">
          {reviews.map((r) => (
            <div className="review" key={r.id} data-testid="review-item">
              <div className="review-head">
                <StaticStars value={r.rating} />
                <span className="review-author">{r.author}</span>
                <span className="review-date">{fmtDate(r.createdAt)}</span>
              </div>
              <p className="review-body">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
