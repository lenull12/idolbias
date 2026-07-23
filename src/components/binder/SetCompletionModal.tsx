"use client";

export default function SetCompletionModal({
  packName,
  onClose,
}: {
  packName: string;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: "var(--surface-card, #13131f)",
        borderRadius: 16, padding: "32px 40px",
        border: "1.5px solid rgba(255,255,255,0.1)",
        maxWidth: 380, textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          Set completed!
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px" }}>
          You collected all characters in the <strong>{packName}</strong> set.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "10px 28px", borderRadius: 8,
            border: "none", background: "var(--accent-purple, #7c3aed)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: "pointer", letterSpacing: 1,
          }}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
