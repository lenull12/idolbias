"use client";

import { useState } from "react";
import CloseButton from "@/components/CloseButton";
import StyledInput from "@/components/StyledInput";

export default function ContactModal({ onClose, initialName, initialEmail }: {
  onClose: () => void;
  initialName?: string;
  initialEmail?: string;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      setSent(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    }
    setSending(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid rgba(var(--text-primary-rgb),0.12)",
    background: "rgba(var(--text-primary-rgb),0.02)", color: "var(--text-primary)",
    fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(var(--text-primary-rgb),0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        cursor: "pointer",
      }}
    >
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
          width: "min(360px, 90vw)",
          borderRadius: 16, overflow: "hidden",
          border: "2px solid var(--text-primary)",
          boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
          background: "var(--surface-white)",
          cursor: "default",
        }}
      >
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontFamily: "var(--font-display, cursive)", fontWeight: 700, color: "var(--text-primary)" }}>
              🆘 Contact us
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Send us a message and we'll get back to you
            </div>
          </div>

          {sent ? (
            <div style={{
              textAlign: "center", padding: "24px 0",
              fontSize: 14, fontWeight: 700, color: "var(--accent-hotpink)",
            }}>
              ✓ Message sent!
            </div>
          ) : (
            <>
              <StyledInput
                placeholder="Your name"
                value={name}
                onChange={setName}
              />
              <StyledInput
                placeholder="Your email"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <textarea
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              />

              {error && (
                <div style={{ fontSize: 12, color: "#ff5050", fontWeight: 600, textAlign: "center" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !name.trim() || !email.trim() || !message.trim()}
                style={{
                  padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: sending || !name.trim() || !email.trim() || !message.trim()
                    ? "rgba(var(--text-primary-rgb),0.06)"
                    : "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                  color: sending || !name.trim() || !email.trim() || !message.trim()
                    ? "var(--text-disabled)" : "var(--surface-white)",
                  fontSize: 14, fontWeight: 800, fontFamily: "var(--font-sans, monospace)",
                  letterSpacing: "1.5px",
                }}
              >
                {sending ? "SENDING..." : "SEND"}
              </button>

              <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-disabled)" }}>
                Or email us directly at{" "}
                <a href="mailto:help@idolbias.com" style={{ color: "var(--accent-hotpink)", fontWeight: 600 }}>
                  help@idolbias.com
                </a>
              </div>
            </>
          )}

          <CloseButton onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
