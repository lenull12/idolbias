"use client";

import { IDOL_NAMES } from "@/data/cards";
import { BIAS_COOLDOWN_DAYS } from "@/lib/gameConfig";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";

type Purchase = {
  id: string;
  packageId: string;
  gemsCredited: number;
  amountPaid: number;
  currency: string;
  status: string;
  createdAt: number;
};

function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchases")
      .then((r) => r.json())
      .then((data) => setPurchases(data.purchases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || purchases.length === 0) return null;

  return (
    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.3)", border: "1px solid rgba(255,158,196,0.06)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase", marginBottom: 10 }}>✦ Purchase history</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {purchases.map((p) => {
          const date = new Date(p.createdAt);
          const priceStr = (p.amountPaid / 100).toLocaleString("fr-FR", { style: "currency", currency: p.currency.toUpperCase() });
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,158,196,0.04)" }}>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>+{p.gemsCredited.toLocaleString()} Gems</span>
                <span style={{ color: "var(--text-disabled)", marginLeft: 6 }}>{date.toLocaleDateString()}</span>
              </div>
              <span style={{ color: "var(--text-muted)" }}>{priceStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileView({ bias, onSetBias, tickets, gems, collectionCount, uniqueCards, biasCooldown }: {
  bias: string | null;
  onSetBias: (idol: string) => void;
  tickets: number;
  gems: number;
  collectionCount: number;
  uniqueCards: number;
  biasCooldown?: number | null;
}) {
  const [session, setSession] = useState<any>(null);
  useEffect(() => { authClient.getSession().then((r) => setSession(r.data)); }, []);
  const user = session?.user;

  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[1100px]"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 32,
        gap: 24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 41, opacity: 0.15 }}>👤</span>
        <span style={{ fontSize: 15, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "1px" }}>
          My Profile
        </span>
      </div>

      {/* ─── Wallet ─── */}
      <div style={{
        width: "100%", maxWidth: 420, display: "flex", gap: 12,
      }}>
        <div style={{
          flex: 1, padding: "16px 20px", borderRadius: 12,
          background: "rgba(var(--surface-white-rgb),0.5)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,158,196,0.08)", textAlign: "center",
        }}>
          <span style={{ fontSize: 20 }}>🎟️</span>
          <div style={{ fontFamily: "var(--font-display, cursive)", fontSize: 22, color: "var(--accent-hotpink)", marginTop: 4 }}>{tickets}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>Tickets</div>
        </div>
        <div style={{
          flex: 1, padding: "16px 20px", borderRadius: 12,
          background: "rgba(var(--surface-white-rgb),0.5)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,158,196,0.08)", textAlign: "center",
        }}>
          <span style={{ fontSize: 20 }}>💎</span>
          <div style={{ fontFamily: "var(--font-display, cursive)", fontSize: 22, color: "var(--currency-gems)", marginTop: 4 }}>{gems}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>Gems</div>
        </div>
      </div>

      {/* ─── Collection Stats ─── */}
      <div style={{
        width: "100%", maxWidth: 420, display: "flex", gap: 12,
      }}>
        <div style={{
          flex: 1, padding: "16px 20px", borderRadius: 12,
          background: "rgba(var(--surface-white-rgb),0.5)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,158,196,0.08)", textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-display, cursive)", fontSize: 22, color: "var(--text-primary)" }}>{uniqueCards}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>Unique Cards</div>
        </div>
        <div style={{
          flex: 1, padding: "16px 20px", borderRadius: 12,
          background: "rgba(var(--surface-white-rgb),0.5)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,158,196,0.08)", textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-display, cursive)", fontSize: 22, color: "var(--text-primary)" }}>{collectionCount}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>Total Cards</div>
        </div>
      </div>

      {/* ─── Bias Picker ─── */}
      <div style={{
        width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 12,
        padding: 20, borderRadius: 16, background: "rgba(var(--surface-white-rgb),0.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,158,196,0.08)", textAlign: "left",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase" }}>
          ✦ Choose your bias
        </span>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Your bias gets better odds every time you pull. You can change once every {BIAS_COOLDOWN_DAYS} days.
        </span>
        {biasCooldown !== null && biasCooldown !== undefined && biasCooldown > 0 && (
          <span style={{ fontSize: 11, color: "var(--accent-pink)", fontWeight: 600 }}>
            ⏳ Can change again in {biasCooldown} day(s)
          </span>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {IDOL_NAMES.map((idol) => {
            const active = bias === idol;
            return (
              <button
                key={idol}
                onClick={() => onSetBias(idol)}
                style={{
                  padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "none",
                  outline: active ? "2px solid var(--text-primary)" : "1.5px solid rgba(var(--text-primary-rgb),0.12)",
                  outlineOffset: -2,
                  background: active ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "rgba(var(--surface-white-rgb),0.6)",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  fontFamily: "var(--font-display, cursive)", fontSize: 14, fontWeight: 700,
                  boxShadow: active ? "3px 3px 0px rgba(var(--text-primary-rgb),0.9)" : "none",
                }}
              >
                {active ? "💖 " : ""}{idol}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.3)", border: "1px solid rgba(255,158,196,0.06)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase", marginBottom: 8 }}>✦ Account</div>
        {user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user.image && (
                <img src={user.image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email}</div>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!confirm("Delete your account and all data? This cannot be undone.")) return;
                try {
                  const res = await fetch("/api/account", { method: "DELETE" });
                  if (res.ok) {
                    alert("Account deleted.");
                    window.location.reload();
                  } else {
                    alert("Delete failed.");
                  }
                } catch {
                  alert("Delete failed.");
                }
              }}
              style={{
                marginTop: 10, padding: "6px 14px", borderRadius: 8,
                border: "1px solid rgba(255,80,80,0.3)",
                background: "transparent", color: "#ff5050",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Delete account
            </button>
          </>
        ) : null}
      </div>

      {/* Purchase history */}
      <PurchaseHistory />

      {!user && (
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.3)", border: "1px solid rgba(255,158,196,0.06)" }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
            Sign in to save your progress across devices.
          </p>
          <Link href="/login" style={{
            display: "inline-block", padding: "8px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
            color: "var(--surface-white)", fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}>
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
