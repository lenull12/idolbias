"use client";

export default function PersonalityAxis({
  leftLabel,
  rightLabel,
  value,
  leftColor,
  rightColor,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  leftColor: string;
  rightColor: string;
}) {
  const clamped = Math.max(-100, Math.min(100, value));
  const pct = Math.abs(clamped) / 100;
  const leansRight = clamped >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: leansRight ? "var(--text-disabled)" : leftColor }}>{leftLabel}</span>
        <span style={{ color: leansRight ? rightColor : "var(--text-disabled)" }}>{rightLabel}</span>
      </div>

      <div style={{
        position: "relative",
        height: 6,
        borderRadius: 3,
        background: "rgba(var(--text-primary-rgb),0.06)",
        overflow: "hidden",
      }}>
        {/* Center notch */}
        <div style={{
          position: "absolute",
          left: "50%", top: 0, bottom: 0,
          width: 2, borderRadius: 1,
          background: "rgba(var(--text-primary-rgb),0.15)",
          transform: "translateX(-50%)",
          zIndex: 1,
        }} />

        {/* Fill bar */}
        <div style={{
          position: "absolute",
          top: 0, bottom: 0,
          borderRadius: 3,
          ...(leansRight
            ? { left: "50%", width: `${pct * 50}%` }
            : { right: "50%", width: `${pct * 50}%` }),
          background: `linear-gradient(${leansRight ? 90 : -90}deg, rgba(var(--text-primary-rgb),0.08), ${leansRight ? rightColor : leftColor})`,
          transition: "width 0.3s",
        }} />
      </div>
    </div>
  );
}
