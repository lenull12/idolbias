"use client";

import { IconChevronLeft, IconChevronRight } from "@/components/Icons";

export default function ArrowButton({
  direction, onClick, disabled, label, size = 14, variant = "default",
}: {
  direction: "left" | "right";
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  size?: number;
  variant?: "default" | "overlay";
}) {
  const canClick = !disabled && !!onClick;
  const isOverlay = variant === "overlay";

  const baseBg = isOverlay
    ? "rgba(0,0,0,0.35)"
    : "transparent";
  const baseBorder = isOverlay
    ? "2px solid rgba(255,255,255,0.2)"
    : "2px solid rgba(var(--text-primary-rgb),0.12)";
  const baseColor = isOverlay
    ? "var(--surface-white)"
    : canClick ? "var(--text-secondary)" : "var(--text-disabled)";
  const hoverBg = isOverlay
    ? "rgba(0,0,0,0.55)"
    : "rgba(var(--text-primary-rgb),0.06)";
  const hoverBorder = isOverlay
    ? "rgba(255,255,255,0.4)"
    : "var(--text-primary)";

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: label ? "5px 12px" : "6px 10px",
        borderRadius: 8, cursor: canClick ? "pointer" : "default",
        border: baseBorder,
        background: baseBg,
        color: baseColor,
        fontSize: 11, fontWeight: 700,
        fontFamily: "var(--font-display)",
        opacity: disabled ? 0.3 : 1,
        transition: "background 0.15s, border-color 0.15s",
        backdropFilter: isOverlay ? "blur(4px)" : undefined,
        WebkitBackdropFilter: isOverlay ? "blur(4px)" : undefined,
      }}
      onMouseEnter={(e) => {
        if (canClick) {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.borderColor = hoverBorder;
        }
      }}
      onMouseLeave={(e) => {
        if (canClick) {
          e.currentTarget.style.background = baseBg;
          e.currentTarget.style.borderColor = baseBorder;
        }
      }}
    >
      {direction === "left" && !label && <IconChevronLeft size={size} />}
      {direction === "left" && label && <><IconChevronLeft size={size} />{label}</>}
      {direction === "right" && !label && <IconChevronRight size={size} />}
      {direction === "right" && label && <>{label}<IconChevronRight size={size} /></>}
    </button>
  );
}
