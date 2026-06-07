"use client";

export function SkeletonRow() {
  return (
    <div className="skeleton-row" style={{ height: 60, marginBottom: 12 }} />
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: "white",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 24,
    }}>
      <div className="skeleton" style={{ height: 20, marginBottom: 16, width: "60%" }} />
      <div className="skeleton" style={{ height: 16, marginBottom: 8, width: "100%" }} />
      <div className="skeleton" style={{ height: 16, width: "80%" }} />
    </div>
  );
}
