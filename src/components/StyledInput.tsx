"use client";

import { useState } from "react";

const BASE: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10,
  border: "2px solid rgba(var(--text-primary-rgb),0.12)",
  background: "rgba(var(--surface-white-rgb),0.6)",
  color: "var(--text-primary)", fontSize: 13, outline: "none",
  fontFamily: "var(--font-display)", fontWeight: 600,
  width: "100%", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const FOCUS: React.CSSProperties = {
  borderColor: "var(--accent-hotpink)",
};

export default function StyledInput({
  value, onChange, placeholder, type = "text", style, disabled, autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...BASE,
        ...(focused ? FOCUS : {}),
        ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
        ...style,
      }}
    />
  );
}
