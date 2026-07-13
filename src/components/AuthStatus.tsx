"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

type SessionData = {
  user: { id: string; name: string; email: string; image?: string | null } | null;
} | null;

export default function AuthStatus() {
  const [session, setSession] = useState<SessionData>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authClient.getSession().then((res) => setSession(res.data));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    await fetch("/api/logout-player", { method: "POST" });
    window.location.reload();
  };

  const user = session?.user;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {user ? (
        <>
          <button
            onClick={() => setOpen(!open)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 8px", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer",
            }}
          >
            {user.image && (
              <img
                src={user.image}
                alt=""
                style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
              {user.name}
            </span>
          </button>

          {open && (
            <div
              style={{
                position: "absolute", right: 0, top: "100%", marginTop: 4,
                minWidth: 160, padding: 6, borderRadius: 10,
                background: "rgba(var(--surface-white-rgb),0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,158,196,0.1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                zIndex: 50,
              }}
            >
              <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-disabled)" }}>{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 6,
                  border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: "var(--accent-hotpink)",
                  textAlign: "left",
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </>
      ) : (
        <Link
          href="/login"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 8px", borderRadius: 8,
            fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" />
          </svg>
          Sign in
        </Link>
      )}
    </div>
  );
}
