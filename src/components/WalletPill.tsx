"use client";

export default function WalletPill({ icon, value, tone, onIncrement }: {
  icon: string;
  value: number;
  tone: "pink" | "cyan";
  onIncrement?: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: "10px 10px 6px 6px",
      background: "var(--surface-white, #fff)",
      border: "2px solid var(--text-primary)",
      boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
      position: "relative",
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{
        fontFamily: "var(--font-display, cursive)", fontSize: 13, fontWeight: 700,
        color: tone === "pink" ? "var(--accent-hotpink)" : "var(--currency-gems)",
      }}>
        {value}
      </span>
      {tone === "cyan" && onIncrement && (
        <button onClick={(e) => { e.stopPropagation(); onIncrement(); }} style={{
          position: "absolute", top: -6, right: -6,
          width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--accent-hotpink)",
          background: "var(--accent-hotpink)", color: "#fff", fontSize: 10, fontWeight: 800,
          cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}>
          +
        </button>
      )}
    </div>
  );
}
