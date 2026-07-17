"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import StyledInput from "@/components/StyledInput";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading("google");
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    setLoading(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      if (mode === "signin") {
        setLoading("email");
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) {
          setError(err.message || err.code || "Invalid credentials");
          return;
        }
        window.location.href = "/";
      } else {
        setLoading("email");
        const { error: err } = await authClient.signUp.email({ email, password, name });
        if (err) {
          setError(err.message || err.code || "Registration failed");
          return;
        }
        setSuccess("Account created! You can now sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    setLoading("forgot");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).message || "Failed to send reset email");
        return;
      }
      setSuccess("Check your email for the reset link");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
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
        border: "2px solid rgba(var(--text-primary-rgb),0.08)",
      }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          {mode === "signin" ? "Welcome back — link or access your IdolBias account." : "Join IdolBias and start collecting."}
        </p>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,80,80,0.08)", border: "2px solid rgba(255,80,80,0.2)", color: "#ff5050", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(80,200,80,0.08)", border: "2px solid rgba(80,200,80,0.2)", color: "#22c55e", fontSize: 13, fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* Google button — first */}
        <button onClick={handleGoogle} disabled={loading !== null} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "12px 0", borderRadius: 10,
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: "rgba(var(--surface-white-rgb),0.6)",
          color: "var(--text-primary)", fontWeight: 600, fontSize: 14,
          cursor: loading !== null ? "default" : "pointer",
          opacity: loading !== null ? 0.5 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading === "google" ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(var(--text-primary-rgb),0.08)" }} />
          <span style={{ fontSize: 11, color: "var(--text-disabled)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
            or with email
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(var(--text-primary-rgb),0.08)" }} />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StyledInput placeholder="Email" type="email" value={email} onChange={setEmail} />
          <StyledInput placeholder="Password" type="password" value={password} onChange={setPassword} />
          {mode === "signup" && (
            <StyledInput placeholder="Display name" value={name} onChange={setName} />
          )}

          {mode === "signin" && (
            <button type="button" onClick={handleForgotPassword} disabled={loading !== null} style={{
              background: "none", border: "none", padding: 0, cursor: loading !== null ? "default" : "pointer",
              fontSize: 12, color: "var(--accent-hotpink)", fontWeight: 600,
              fontFamily: "var(--font-sans)", textDecoration: "underline", textAlign: "left", opacity: loading !== null ? 0.5 : 1,
            }}>
              Forgot password?
            </button>
          )}

          <button type="submit" disabled={loading !== null} style={{
            padding: "12px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
            color: "var(--text-primary)", fontWeight: 700, fontSize: 14,
            cursor: loading !== null ? "default" : "pointer",
            fontFamily: "var(--font-display)", letterSpacing: "0.5px",
            opacity: loading !== null ? 0.5 : 1,
          }}>
            {loading === "email" ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
          {mode === "signin" ? (
            <>Don&apos;t have an account?{' '}</>
          ) : (
            <>Already have an account?{' '}</>
          )}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setSuccess(null); }} style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            color: "var(--accent-hotpink)", fontWeight: 700, fontSize: 13,
            fontFamily: "var(--font-sans)", textDecoration: "underline",
          }}>
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
