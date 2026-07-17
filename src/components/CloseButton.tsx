"use client";

import { IconX } from "@/components/Icons";

export default function CloseButton({
  onClick, label = "Close", bordered = false, size = 14,
}: {
  onClick: () => void;
  label?: string;
  bordered?: boolean;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 8, cursor: "pointer",
        border: bordered
          ? "2px solid rgba(var(--text-primary-rgb),0.12)"
          : "none",
        background: bordered
          ? "rgba(var(--surface-white-rgb),0.6)"
          : "transparent",
        color: "var(--text-muted)", fontSize: 11, fontWeight: 700,
        fontFamily: "var(--font-display)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (bordered) e.currentTarget.style.background = "rgba(var(--text-primary-rgb),0.06)";
      }}
      onMouseLeave={(e) => {
        if (bordered) e.currentTarget.style.background = "rgba(var(--surface-white-rgb),0.6)";
      }}
    >
      <IconX size={size} />
      {label}
    </button>
  );
}
