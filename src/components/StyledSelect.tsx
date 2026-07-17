"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Option = { value: string; label: string };

export default function StyledSelect({
  options, value, onChange, placeholder,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 8,
          border: open
            ? "2px solid var(--text-primary)"
            : "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: open
            ? "rgba(var(--text-primary-rgb),0.05)"
            : "rgba(var(--surface-white-rgb),0.5)",
          color: open ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: "var(--font-display)",
          whiteSpace: "nowrap", outline: "none",
          transition: "border 0.15s, background 0.15s, color 0.15s",
        }}
      >
        {selectedLabel}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          minWidth: "100%", maxHeight: 220, overflowY: "auto",
          borderRadius: 8, border: "2px solid var(--text-primary)",
          background: "rgba(var(--surface-white-rgb),0.98)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 6px 20px rgba(var(--text-primary-rgb),0.1)",
          zIndex: 9999, padding: 3,
        }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "6px 10px", borderRadius: 6, border: "none",
                  cursor: "pointer", whiteSpace: "nowrap",
                  fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
                  background: isSelected
                    ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
                    : "transparent",
                  color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "rgba(var(--text-primary-rgb),0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
