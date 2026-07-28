"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap" style={{ padding: "90px 0" }}>
      <div className="empty">
        <h3>Something went wrong</h3>
        <p style={{ marginBottom: 6 }}>{error.message}</p>
        {error.digest && (
          <p style={{ fontSize: 12, color: "var(--faint)" }}>digest: {error.digest}</p>
        )}
        <button className="btn" style={{ marginTop: 16 }} onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
