export function Stars({ value }: { value: number }) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} / 5`}>
      {"★".repeat(full)}
      <span style={{ color: "var(--line)" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}
