"use client";

export type StatEntry = { label: string } & (
  | { value: string }
  | { swatches: string[] }
);

export default function ProfileStatGrid({
  stats,
}: {
  stats: StatEntry[];
}) {
  if (stats.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 2,
        background: "rgba(255,158,196,0.12)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "rgba(255,255,255,0.6)",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(var(--text-primary-rgb),0.4)" }}>
            {s.label}
          </span>
          {"value" in s ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              {s.value}
            </span>
          ) : (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {s.swatches.map((c, i) => (
                <div
                  key={i}
                  title={c}
                  style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: c,
                    border: "2px solid rgba(var(--text-primary-rgb),0.12)",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
