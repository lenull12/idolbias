"use client";

const SPARKLES = [
  { top: "8%", left: "10%", size: 10, delay: 0, dur: 5 },
  { top: "15%", left: "85%", size: 8, delay: 1.2, dur: 6 },
  { top: "70%", left: "6%", size: 12, delay: 0.6, dur: 7 },
  { top: "82%", left: "90%", size: 9, delay: 2, dur: 5.5 },
  { top: "45%", left: "94%", size: 7, delay: 0.3, dur: 6.5 },
  { top: "35%", left: "4%", size: 8, delay: 1.6, dur: 5 },
  { top: "92%", left: "40%", size: 7, delay: 2.4, dur: 6 },
  { top: "5%", left: "50%", size: 6, delay: 0.9, dur: 5.8 },
  { top: "25%", left: "25%", size: 8, delay: 0.5, dur: 6 },
  { top: "55%", left: "20%", size: 7, delay: 1.8, dur: 5.5 },
  { top: "75%", left: "50%", size: 6, delay: 0.2, dur: 7 },
  { top: "40%", left: "60%", size: 9, delay: 2.2, dur: 5 },
  { top: "60%", left: "80%", size: 7, delay: 0.7, dur: 6.5 },
  { top: "20%", left: "70%", size: 8, delay: 1.4, dur: 5.8 },
  { top: "50%", left: "40%", size: 6, delay: 3, dur: 6 },
  { top: "88%", left: "70%", size: 7, delay: 1, dur: 5.3 },
  { top: "30%", left: "45%", size: 5, delay: 2.8, dur: 6.2 },
  { top: "65%", left: "35%", size: 8, delay: 0.4, dur: 5.7 },
];

export default function AmbientBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
      <style>{`
        @keyframes ambientFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          50% { transform: translateY(-14px) rotate(12deg); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>

      {/* Stage spotlight glow */}
      <div style={{
        position: "absolute", top: "10%", left: "50%",
        width: "min(520px, 90vw)", height: "min(520px, 90vw)",
        background: "radial-gradient(circle, var(--glow-petal-10) 0%, var(--glow-lilac-06) 45%, transparent 72%)",
        animation: "glowPulse 6s ease-in-out infinite",
        borderRadius: "50%",
      }} />

      {/* Sparkles */}
      {SPARKLES.map((s, i) => (
        <span key={i} style={{
          position: "absolute", top: s.top, left: s.left,
          fontSize: s.size, color: "var(--glow-petal-80)",
          animation: `ambientFloat ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }}>
          {i % 2 === 0 ? "✦" : "✧"}
        </span>
      ))}

      {/* Stage corner brackets */}
      {[
        { top: 24, left: 24, borderTop: "2px solid var(--glow-bloom-40)", borderLeft: "2px solid var(--glow-bloom-40)" },
        { top: 24, right: 24, borderTop: "2px solid var(--glow-bloom-40)", borderRight: "2px solid var(--glow-bloom-40)" },
        { bottom: 24, left: 24, borderBottom: "2px solid var(--glow-bloom-40)", borderLeft: "2px solid var(--glow-bloom-40)" },
        { bottom: 24, right: 24, borderBottom: "2px solid var(--glow-bloom-40)", borderRight: "2px solid var(--glow-bloom-40)" },
      ].map((pos, i) => (
        <div key={i} style={{ position: "absolute", width: 28, height: 28, ...pos }} />
      ))}
    </div>
  );
}