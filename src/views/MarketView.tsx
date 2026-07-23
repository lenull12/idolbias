"use client";

export default function MarketView({
  gems: _gems, onChanged: _onChanged,
}: {
  gems?: number; onChanged?: () => void;
}) {
  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[1100px]"
      style={{ padding: "48px 16px", textAlign: "center" }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔁</div>
      <h1 style={{
        fontFamily: "var(--font-display, cursive)", fontSize: 24, fontWeight: 800,
        color: "var(--text-primary)", margin: "0 0 8px",
      }}>
        Transfer Market
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
        Trade cards with other collectors. List your duplicates, find missing pieces, and build the ultimate collection.
      </p>
      <div style={{
        marginTop: 24, display: "inline-block",
        padding: "10px 24px", borderRadius: 12,
        border: "2px solid rgba(var(--text-primary-rgb),0.12)",
        fontSize: 12, fontWeight: 700, color: "var(--text-disabled)",
        fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
      }}>
        COMING SOON
      </div>
    </div>
  );
}
