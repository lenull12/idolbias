"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function AccountPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then((res) => {
      setSession(res.data ?? null);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
          Not signed in.
        </p>
        <a
          href="/login"
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            background: "var(--accent-hotpink)",
            color: "var(--surface-white)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        padding: "40px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 900,
          margin: 0,
          color: "var(--text-primary)",
        }}
      >
        Account
      </h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: 16,
          borderRadius: 12,
          background: "rgba(var(--surface-white-rgb),0.5)",
          border: "1px solid rgba(255,158,196,0.08)",
        }}
      >
        {session.user.image && (
          <img
            src={session.user.image}
            alt=""
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{session.user.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{session.user.email}</div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: "10px 0",
          borderRadius: 8,
          border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
          background: "transparent",
          color: "var(--text-primary)",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
