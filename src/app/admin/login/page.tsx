"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin/feed");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#0a0a0f", color: "#fff",
      fontFamily: "system-ui, sans-serif", padding: 20,
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 14,
      }}>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 22, fontWeight: 900, margin: 0 }}>
          Admin Login
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          style={{
            padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none",
          }}
        />
        {error && <span style={{ color: "#FF1493", fontSize: 13 }}>{error}</span>}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            padding: "10px", borderRadius: 8, border: "none",
            background: loading || !password ? "rgba(255,255,255,0.05)" : "#FF1493",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading || !password ? "default" : "pointer",
          }}
        >
          {loading ? "Verifying..." : "Login"}
        </button>
      </form>
    </div>
  );
}
