"use client";

export type FeedMode = "foryou" | "following";

export default function FeedTabs({
  mode,
  onChange,
  hasSubs,
}: {
  mode: FeedMode;
  onChange: (m: FeedMode) => void;
  hasSubs: boolean;
}) {
  return (
    <div style={{ display: "flex", padding: "0 14px 12px", gap: 8 }}>
      <button
        onClick={() => onChange("foryou")}
        style={{
          flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
          background: mode === "foryou" ? "rgba(255,158,196,0.1)" : "transparent",
          color: mode === "foryou" ? "var(--accent-hotpink)" : "var(--text-muted)",
          fontWeight: mode === "foryou" ? 700 : 500,
          fontSize: 13, cursor: "pointer",
          fontFamily: "var(--font-sans)",
          position: "relative",
        }}
      >
        For You
        {mode === "foryou" && (
          <div style={{
            position: "absolute", bottom: 0, left: "25%", right: "25%",
            height: 2, borderRadius: 2,
            background: "var(--accent-hotpink)",
          }} />
        )}
      </button>
      <button
        onClick={() => hasSubs && onChange("following")}
        style={{
          flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
          background: mode === "following" ? "rgba(255,158,196,0.1)" : "transparent",
          color: mode === "following" ? "var(--accent-hotpink)" : hasSubs ? "var(--text-muted)" : "var(--text-disabled)",
          fontWeight: mode === "following" ? 700 : 500,
          fontSize: 13, cursor: hasSubs ? "pointer" : "default",
          fontFamily: "var(--font-sans)",
          opacity: hasSubs ? 1 : 0.5,
          position: "relative",
        }}
      >
        Following
        {mode === "following" && (
          <div style={{
            position: "absolute", bottom: 0, left: "25%", right: "25%",
            height: 2, borderRadius: 2,
            background: "var(--accent-hotpink)",
          }} />
        )}
      </button>
    </div>
  );
}
