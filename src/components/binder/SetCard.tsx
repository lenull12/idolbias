"use client";

import type { CharacterDef, PackInfo } from "@/data/footballCards";

export default function SetCard({
  pack,
  characters,
  collected,
}: {
  pack: PackInfo;
  characters: CharacterDef[];
  collected: number;
}) {
  const total = characters.length;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div style={{
      borderRadius: 12, overflow: "hidden",
      border: "1.5px solid rgba(255,255,255,0.08)",
      background: "var(--surface-card, #13131f)",
      cursor: "pointer", transition: "transform 0.15s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      <div style={{ padding: "14px 16px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "var(--text-disabled)", textTransform: "uppercase" }}>
          {pack.edition}
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, color: "var(--text-primary)" }}>
          {pack.name}
        </span>
        <div style={{
          width: "100%", height: 4, borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          marginTop: 4,
        }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: 2,
            transition: "width 0.4s ease",
            background: "linear-gradient(90deg, var(--accent-purple, #7c3aed), var(--accent-hotpink, #ff69b4))",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
          {collected}/{total} collected · {pct}%
        </span>
      </div>
    </div>
  );
}
