"use client";

import { useEffect, useState } from "react";

export type Reward = { tickets?: number; gems?: number; dust?: number };

export default function RewardToast({ reward, onDone }: { reward: Reward; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const parts: string[] = [];
  if (reward.tickets) parts.push(`+${reward.tickets} 🎟️`);
  if (reward.gems) parts.push(`+${reward.gems} 💎`);
  if (reward.dust) parts.push(`+${reward.dust} 💠`);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      display: "flex", justifyContent: "center", pointerEvents: "none",
      transition: "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s ease",
      transform: visible ? "translateY(0)" : "translateY(-100%)",
      opacity: visible ? 1 : 0,
    }}>
      <div style={{
        padding: "10px 24px", borderRadius: "0 0 12px 12px",
        background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
        color: "var(--surface-white)", fontWeight: 800, fontSize: 14,
        fontFamily: "var(--font-display, cursive)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {parts.join(" · ")}
      </div>
    </div>
  );
}
