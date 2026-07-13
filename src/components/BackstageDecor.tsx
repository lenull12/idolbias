"use client";

const NOTES = [
  { top: "16%", left: "14%", symbol: "♪", size: 16, delay: 0, dur: 7 },
  { top: "12%", left: "46%", symbol: "♫", size: 13, delay: 1.4, dur: 6.5 },
  { top: "30%", left: "65%", symbol: "♪", size: 14, delay: 0.6, dur: 7.5 },
  { top: "8%", left: "72%", symbol: "✧", size: 11, delay: 2, dur: 6 },
  { top: "40%", left: "6%", symbol: "♫", size: 13, delay: 1, dur: 7 },
  { top: "58%", left: "90%", symbol: "✦", size: 15, delay: 0.3, dur: 6.8 },
  { top: "68%", left: "22%", symbol: "♫", size: 12, delay: 1.8, dur: 6.2 },
  { top: "22%", left: "82%", symbol: "♪", size: 14, delay: 2.4, dur: 7.2 },
];

const BOKEH = [
  { top: "60%", left: "10%", size: 14, color: "var(--glow-petal-50)", delay: 0, dur: 9 },
  { top: "75%", left: "85%", size: 20, color: "var(--glow-lilac-45)", delay: 2, dur: 10 },
  { top: "45%", left: "92%", size: 10, color: "var(--glow-white-60)", delay: 1, dur: 8 },
  { top: "85%", left: "40%", size: 16, color: "var(--glow-petal-40)", delay: 3, dur: 9.5 },
  { top: "90%", left: "65%", size: 12, color: "var(--glow-lilac-40)", delay: 1.6, dur: 8.5 },
];

export default function BackstageDecor() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
      <style>{`
        @keyframes bokehDrift {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        @keyframes noteFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          50% { transform: translateY(-14px) rotate(8deg); opacity: 1; }
        }
      `}</style>

      {/* Bokeh flottant */}
      {BOKEH.map((b, i) => (
        <span key={i} style={{
          position: "absolute", top: b.top, left: b.left,
          width: b.size, height: b.size, borderRadius: "50%",
          background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
          animation: `bokehDrift ${b.dur}s ease-in-out ${b.delay}s infinite`,
        }} />
      ))}

      {/* Stickers musicaux */}
      {NOTES.map((n, i) => (
        <span key={i} style={{
          position: "absolute", top: n.top, left: n.left,
          fontSize: n.size, color: "var(--glow-bloom-60)",
          animation: `noteFloat ${n.dur}s ease-in-out ${n.delay}s infinite`,
        }}>
          {n.symbol}
        </span>
      ))}
    </div>
  );
}