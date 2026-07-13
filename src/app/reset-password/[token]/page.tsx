"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).message || (data as any).error || "Invalid or expired token");
        return;
      }
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
    background: "rgba(var(--surface-white-rgb),0.6)",
    color: "var(--text-primary)", fontSize: 14, outline: "none",
    fontFamily: "var(--font-sans)", boxSizing: "border-box",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: 20,
      background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-end) 50%, var(--bg) 100%)",
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 16,
        padding: "32px 24px", borderRadius: 16,
        background: "rgba(var(--surface-white-rgb),0.5)",
        border: "1px solid rgba(255,158,196,0.08)",
      }}>
        {success ? (
          <>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
              Password reset
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Your password has been successfully reset.
            </p>
            <Link href="/login" style={{
              display: "inline-block", padding: "12px 0", borderRadius: 10, textAlign: "center",
              background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
              color: "var(--text-primary)", fontWeight: 700, fontSize: 14,
              fontFamily: "var(--font-display)", textDecoration: "none",
            }}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
              Reset password
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Enter your new password below.
            </p>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff5050", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              <input placeholder="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
              <button type="submit" disabled={loading} style={{
                padding: "12px 0", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                color: "var(--text-primary)", fontWeight: 700, fontSize: 14,
                cursor: loading ? "default" : "pointer",
                fontFamily: "var(--font-display)", letterSpacing: "0.5px",
                opacity: loading ? 0.5 : 1,
              }}>
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
