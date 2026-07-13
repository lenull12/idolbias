"use client";

import { useCountdown } from "@/lib/useCountdown";

export default function EventCountdown({ endsAt, label }: {
  endsAt: string | number | Date;
  label?: string;
}) {
  const ts = typeof endsAt === "string" ? new Date(endsAt).getTime()
    : endsAt instanceof Date ? endsAt.getTime()
    : endsAt;
  const display = useCountdown(ts);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 8,
      border: "1.5px solid var(--accent-hotpink)",
      background: "rgba(255,20,147,0.06)",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "var(--accent-hotpink)",
        animation: "eventPulse 1.5s ease-in-out infinite",
      }} />
      <span style={{
        fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
        color: "var(--accent-hotpink)", letterSpacing: "0.5px",
      }}>
        {label ? `${label} · ` : ""}{display ?? "ended"}
      </span>
      <style>{`@keyframes eventPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
