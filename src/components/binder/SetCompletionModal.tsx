"use client";

import CloseButton from "@/components/CloseButton";

export default function SetCompletionModal({
  packCode,
  packName,
  edition,
  coverImage,
  totalCards,
  reward,
  onClaim,
  onDismiss,
  claiming = false,
  claimed = false,
}: {
  packCode: string;
  packName: string;
  edition: string;
  coverImage?: string;
  totalCards: number;
  reward: { dust: number; gems: number };
  onClaim: () => Promise<void>;
  onDismiss: () => void;
  claiming?: boolean;
  claimed?: boolean;
}) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(var(--text-primary-rgb),0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        cursor: "pointer",
      }}
    >
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }

        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Confettis */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          position: "fixed", top: -10, left: `${5 + Math.random() * 90}%`, zIndex: 1000,
          width: 6 + Math.random() * 6, height: 6 + Math.random() * 6,
          borderRadius: Math.random() > 0.5 ? "50%" : 2,
          background: ["var(--accent-hotpink)", "var(--accent-pink)", "var(--accent-purple)", "var(--holo-c)", "var(--rarity-legendary-badge)", "var(--holo-d)"][i % 6],
          animation: `confettiFall ${1.5 + Math.random() * 2}s ease-out ${i * 0.08}s forwards`,
          pointerEvents: "none",
        }} />
      ))}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
          width: "min(340px, 88vw)",
          borderRadius: 16, overflow: "hidden",
          border: "2px solid var(--text-primary)",
          boxShadow: "5px 5px 0px rgba(var(--text-primary-rgb),0.9)",
          background: "var(--surface-white)",
          cursor: "default",
        }}
      >
        {/* Cover */}
        <div style={{
          position: "relative", width: "100%", aspectRatio: "896/576",
          overflow: "hidden",
          background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple), var(--holo-c))",
        }}>
          {coverImage ? (
            <img src={coverImage} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
              ✦
            </div>
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.05) 0%, rgba(var(--text-primary-rgb),0.72) 100%)",
          }} />
          <div style={{
            position: "absolute", bottom: 10, left: 12,
            fontFamily: "var(--font-display, cursive)", fontSize: 16, fontWeight: 700,
            color: "var(--surface-white)", textShadow: "2px 2px 0 rgba(var(--text-primary-rgb),0.4)",
          }}>
            ✨ SET COMPLETE!
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display, cursive)", color: "var(--text-primary)" }}>
              {packName}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)", fontWeight: 600, letterSpacing: "0.5px" }}>
              {edition.toUpperCase()} · {totalCards}/{totalCards} cards
            </div>
          </div>

          {/* Rewards */}
          <div style={{
            display: "flex", gap: 12, justifyContent: "center",
            padding: "12px", borderRadius: 10,
            background: "rgba(var(--text-primary-rgb),0.03)",
             border: "2px solid rgba(var(--text-primary-rgb),0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-display, cursive)", color: "var(--text-primary)" }}>
                +{reward.dust} dust
              </span>
            </div>
            <div style={{ width: 1, background: "rgba(var(--text-primary-rgb),0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>💎</span>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-display, cursive)", color: "var(--text-primary)" }}>
                +{reward.gems} gems
              </span>
            </div>
          </div>

          {/* Action */}
          {claimed ? (
            <div style={{
              padding: "10px 0", borderRadius: 10,
              background: "linear-gradient(135deg, rgba(194,84,46,0.08), rgba(224,118,64,0.06))",
              border: "2px solid var(--rarity-legendary-badge)",
              textAlign: "center", fontSize: 13, fontWeight: 800,
              fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
              color: "var(--rarity-legendary-badge)",
            }}>
              ✓ CLAIMED
            </div>
          ) : (
            <button
              onClick={onClaim}
              disabled={claiming}
              style={{
                padding: "10px 0", borderRadius: 10,
                border: "2px solid var(--accent-hotpink)",
                background: claiming ? "rgba(255,20,147,0.04)" : "linear-gradient(135deg, rgba(255,20,147,0.06), rgba(255,158,196,0.04))",
                color: claiming ? "var(--text-disabled)" : "var(--accent-hotpink)",
                fontSize: 13, fontWeight: 800, cursor: claiming ? "default" : "pointer",
                fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
              }}
            >
              {claiming ? "CLAIMING..." : "CLAIM REWARDS"}
            </button>
          )}

          {/* Dismiss */}
          <CloseButton onClick={onDismiss} />
        </div>
      </div>
    </div>
  );
}
