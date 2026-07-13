"use client";

const LEFT_W = 150;
const STUB_W = 58;
const HEIGHT = 64;
const DOTS = 1;

export default function RaffleTicketBadge({
  packCode,
  secretCount,
}: {
  packCode: string;
  secretCount: number;
}) {
  const totalW = LEFT_W + DOTS + STUB_W;

  const holeMask = [
    "radial-gradient(circle 6px at " + LEFT_W + "px 0px, transparent 6px, #000 6.5px)",
    "radial-gradient(circle 6px at " + LEFT_W + "px " + HEIGHT + "px, transparent 6px, #000 6.5px)",
  ].join(", ");

  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 2,
        transform: "rotate(-4deg)",
        filter: "drop-shadow(3px 4px 6px rgba(26,10,30,.5))",
        display: "flex",
        height: HEIGHT,
        width: totalW,
      }}
    >
      {/* Left section */}
      <div
        style={{
          width: LEFT_W,
          height: HEIGHT,
          background: "var(--parchment)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          padding: "0 12px",
          position: "relative",
          WebkitMaskImage: "linear-gradient(#000, #000), " + holeMask,
          WebkitMaskComposite: "source-over, destination-out",
          maskImage: "linear-gradient(#000, #000), " + holeMask,
          maskComposite: "add, subtract",
        }}
      >
        <span style={{
          fontSize: 9, fontFamily: "var(--font-mono, monospace)",
          color: "var(--text-muted)", letterSpacing: "1px",
        }}>
          ADMIT ONE · PACK OPENING
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-display, cursive)",
          color: "var(--text-primary)",
        }}>
          CHASE PULL
        </span>
      </div>

      {/* Perforation line */}
      <div
        style={{
          width: DOTS,
          height: HEIGHT,
          background: `repeating-linear-gradient(180deg,
            rgba(26,10,30,.35) 0px,
            rgba(26,10,30,.35) 4px,
            transparent 4px,
            transparent 9px
          )`,
          flexShrink: 0,
        }}
      />

      {/* Right stub */}
      <div
        style={{
          width: STUB_W,
          height: HEIGHT,
          background: "conic-gradient(from 20deg, var(--holo-c), var(--holo-d), var(--accent-pink), var(--accent-purple), var(--holo-c))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l2.5 5.1L20 9l-4 3.9.9 5.6L12 15.5 7.1 18.5 8 12.9 4 9l5.5-.9L12 3z" fill="var(--text-primary)" />
        </svg>
        <span style={{
          fontSize: 18, fontWeight: 700,
          fontFamily: "var(--font-display, cursive)",
          color: "var(--text-primary)", lineHeight: 1,
        }}>
          {secretCount}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: ".5px",
          color: "var(--text-primary)",
        }}>
          SECRET
        </span>
      </div>
    </div>
  );
}
