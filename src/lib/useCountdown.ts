"use client";
import { useState, useEffect, useCallback } from "react";

export function useCountdown(targetTimestamp: number | null): string | null {
  const calc = useCallback(() => {
    if (!targetTimestamp) return null;
    const diff = targetTimestamp - Date.now();
    if (diff <= 0) return "Resetting…";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
    if (m > 0) return `${m}m ${pad(s)}s`;
    return `${s}s`;
  }, [targetTimestamp]);

  const [display, setDisplay] = useState<string | null>(calc());
  useEffect(() => {
    setDisplay(calc());
    const id = setInterval(() => setDisplay(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return display;
}
