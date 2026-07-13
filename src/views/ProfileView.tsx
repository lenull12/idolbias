"use client";

import CARDS, { IDOL_NAMES, getCardsByPack, getPackInfo } from "@/data/cards";
import { BIAS_COOLDOWN_DAYS, getFanLevel, STREAK_TICKETS, STREAK_BONUS_GEMS } from "@/lib/gameConfig";
import { useEffect, useState, useMemo } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import SystemWindow from "@/components/SystemWindow";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {purchases.map((p) => {
        const date = new Date(p.createdAt);
        const priceStr = (p.amountPaid / 100).toLocaleString("fr-FR", { style: "currency", currency: p.currency.toUpperCase() });
        return (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(var(--text-primary-rgb),0.04)" }}>
            <div>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>+{p.gemsCredited.toLocaleString()} Gems</span>
              <span style={{ color: "var(--text-disabled)", marginLeft: 6 }}>{date.toLocaleDateString()}</span>
            </div>
            <span style={{ color: "var(--text-muted)" }}>{priceStr}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfileView({
  bias, onSetBias, tickets, gems, collectionCount, uniqueCards, biasCooldown,
  dust = 0, owned = {}, streak = 0, canClaimDaily = false,
  onClaimDaily, playerName, createdAt,
}: {
  bias: string | null;
  onSetBias: (idol: string) => void;
  tickets: number;
  gems: number;
  collectionCount: number;
  uniqueCards: number;
  biasCooldown?: number | null;
  dust?: number;
  owned?: Record<string, number>;
  streak?: number;
  canClaimDaily?: boolean;
  onClaimDaily?: () => Promise<{ tickets: number; gems: number; streak: number } | null>;
  playerName?: string;
  createdAt?: number | Date | null;
}) {
  const [session, setSession] = useState<any>(null);
  useEffect(() => { authClient.getSession().then((r) => setSession(r.data)); }, []);
  const user = session?.user;
  const displayName = playerName || user?.name || "FAN";
  const initial = displayName[0]?.toUpperCase() || "F";
  const daysSince = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) : 0;

  const todayIdx = canClaimDaily ? streak % 7 : 0;
  const todayTickets = STREAK_TICKETS[todayIdx];
  const todayGems = STREAK_BONUS_GEMS[todayIdx];
  const fan = useMemo(() => {
    // Approximate fan XP from owned cards
    const totalXp = Object.entries(owned).reduce((sum, [id, qty]) => {
      const card = CARDS.find(c => c.id === id);
      return sum + (card ? 5 : 0) * qty;
    }, 0);
    return getFanLevel(totalXp);
  }, [owned]);

  const [giftClaimed, setGiftClaimed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("idolbias_gift_claimed") === "true";
  });

  const handleClaimGift = async () => {
    localStorage.setItem("idolbias_gift_claimed", "true");
    setGiftClaimed(true);
  };

  const [claimingStreak, setClaimingStreak] = useState(false);
  const handleClickDaily = async () => {
    if (!onClaimDaily || claimingStreak || !canClaimDaily) return;
    setClaimingStreak(true);
    await onClaimDaily();
    setClaimingStreak(false);
  };

  // Badge helpers
  const badge = (icon: string, name: string, unlocked: boolean, desc: string) => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div
        key={name}
        onClick={() => setExpanded(!expanded)}
        style={{
          width: 96, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          textAlign: "center", padding: "12px 6px 10px", borderRadius: 12,
          border: unlocked ? "1.5px solid var(--text-primary)" : "1.5px solid rgba(var(--text-primary-rgb),0.08)",
          boxShadow: unlocked ? "3px 3px 0px rgba(var(--text-primary-rgb),0.9)" : "none",
          opacity: unlocked ? 1 : 0.45, cursor: "pointer", position: "relative",
          transition: "all 0.15s",
        }}
      >
        {!unlocked && (
          <span style={{ position: "absolute", top: 6, right: 6, fontSize: 10, opacity: 0.5 }}>🔒</span>
        )}
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
          background: unlocked ? "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))" : "rgba(var(--text-primary-rgb),0.04)",
          border: unlocked ? "2px solid var(--text-primary)" : "2px solid rgba(var(--text-primary-rgb),0.08)",
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, color: "var(--text-primary)" }}>
          {name}
        </div>
        {expanded && (
          <div style={{ fontSize: 9.5, color: "var(--text-muted)", lineHeight: 1.3, marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
    );
  };

  const fanLevel = fan.level;
  const completeSets = useMemo(() => {
    const ownedSet = new Set(Object.keys(owned));
    const packCodes = [...new Set(CARDS.map(c => c.packCode))];
    let completed = 0;
    for (const code of packCodes) {
      const packCards = getCardsByPack(code);
      if (packCards.length > 0 && packCards.every(c => ownedSet.has(c.id))) completed++;
    }
    return completed;
  }, [owned]);

  // Pack progression for collection window
  const packProgression = useMemo(() => {
    const ownedSet = new Set(Object.keys(owned));
    const packCodes = [...new Set(CARDS.map(c => c.packCode))];
    return packCodes.map(code => {
      const packCards = getCardsByPack(code);
      const ownedCount = packCards.filter(c => ownedSet.has(c.id)).length;
      const total = packCards.length;
      const name = CARDS.find(c => c.packCode === code)?.pack || code;
      return { code, name, ownedCount, total };
    }).sort((a, b) => {
      const aPct = a.total > 0 ? a.ownedCount / a.total : 1;
      const bPct = b.total > 0 ? b.ownedCount / b.total : 1;
      return aPct - bPct;
    });
  }, [owned]);

  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[900px]"
      style={{ padding: "24px 16px 48px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* ─── Identity + Wallet ─── */}
      <SystemWindow title="My Profile" width="100%">
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{
            width: 74, height: 74, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
            border: "2px solid var(--text-primary)",
            boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "var(--surface-white)",
            fontFamily: "var(--font-display, cursive)", flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 20, fontWeight: 900, margin: 0, color: "var(--text-primary)", lineHeight: 1 }}>
                {displayName}
              </h1>
              <span style={{
                padding: "2px 8px", borderRadius: 20,
                background: "linear-gradient(135deg, #2E1F4D, #1A0F2E)",
                color: "var(--holo-d, #9EE6FF)", fontSize: 10, fontWeight: 700,
                fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px",
              }}>
                FOUNDER
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {createdAt
                ? `Member since ${new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${daysSince} days on IdolBias`
                : "Member"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-hotpink)", display: "inline-block" }} />
              Bias: {bias || "None"} · VICIOUS
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
          {[
            { icon: "🎟️", value: tickets, label: "Tickets", color: "var(--accent-hotpink)" },
            { icon: "💎", value: gems, label: "Gems", color: "var(--currency-gems)" },
            { icon: "✨", value: dust, label: "Dust", color: "var(--accent-purple)" },
          ].map((item) => (
            <div key={item.label} style={{
              padding: 14, textAlign: "center", borderRadius: 10,
              background: "rgba(var(--text-primary-rgb),0.02)",
              border: "1px solid rgba(var(--text-primary-rgb),0.06)",
            }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</div>
              <div style={{ fontFamily: "var(--font-display, cursive)", fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.1 }}>
                {item.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 1 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Fan level */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Fan Lv.{fan.level}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fan.xpIntoLevel}/{fan.xpForNext} XP</span>
          </div>
          <div style={{
            width: "100%", height: 8, borderRadius: 4,
            background: "rgba(var(--text-primary-rgb),0.08)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${(fan.xpIntoLevel / fan.xpForNext) * 100}%`,
              background: "linear-gradient(90deg, var(--accent-hotpink), var(--accent-purple))",
              transition: "width 0.4s",
            }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            🔒 {Math.max(0, 5 - fanLevel)} levels to Rookie Fan badge
          </div>
        </div>
      </SystemWindow>

      {/* ─── Daily streak strip ─── */}
      <div style={{
        background: "linear-gradient(100deg, rgba(255,20,147,0.08), rgba(201,177,255,0.10))",
        border: "1.5px dashed rgba(var(--text-primary-rgb),0.25)",
        borderRadius: 12, padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            {streak}-day streak
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const isPast = i < todayIdx;
              const isToday = i === todayIdx;
              const isFuture = i > todayIdx;
              return (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
                  background: isPast ? "var(--accent-hotpink)" : isToday ? "var(--holo-d, #9EE6FF)" : "transparent",
                  color: isPast ? "var(--surface-white)" : isToday ? "var(--text-primary)" : "var(--text-disabled)",
                  border: isFuture ? "1.5px dashed rgba(var(--text-primary-rgb),0.15)" : "1.5px solid transparent",
                  boxShadow: isToday ? "0 0 0 3px rgba(255,20,147,0.25)" : "none",
                }}>
                  {isPast ? "✓" : i + 1}
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleClickDaily}
          disabled={!canClaimDaily || claimingStreak}
          style={{
            padding: "9px 16px", borderRadius: 8, border: "none", cursor: canClaimDaily ? "pointer" : "default",
            background: canClaimDaily ? "var(--text-primary)" : "rgba(var(--text-primary-rgb),0.06)",
            color: canClaimDaily ? "var(--surface-white)" : "var(--text-disabled)",
            fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
        >
          {claimingStreak ? "..." : canClaimDaily
            ? `Claim Day ${todayIdx + 1} · ${todayTickets > 0 ? `+${todayTickets} 🎟️` : todayGems > 0 ? `+${todayGems} 💎` : "Claim"}`
            : "Come back tomorrow"}
        </button>
      </div>

      {/* ─── Gift banner ─── */}
      {!giftClaimed && (
        <div style={{
          background: "var(--surface-white)",
          border: "2px solid var(--text-primary)",
          boxShadow: "4px 4px 0px rgba(var(--text-primary-rgb),0.9)",
          borderRadius: 12,
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 26 }}>🎁</span>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>A gift from IdolBias</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              A little welcome gift to help you start your collection.
            </div>
          </div>
          <button
            onClick={handleClaimGift}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "1.5px solid var(--text-primary)",
              background: "var(--holo-d, #9EE6FF)", cursor: "pointer",
              fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 700,
              color: "var(--text-primary)", whiteSpace: "nowrap",
            }}
          >
            Claim +300 💎
          </button>
        </div>
      )}

      {/* ─── Grid Badges + Collection ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Badges */}
        <SystemWindow title="Badges" width="100%">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Founder */}
            <div>
              <SectionTitle>Founder</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("✦", "Day One", true, "Joined during launch week")}
              </div>
            </div>

            {/* Fan devotion */}
            <div>
              <SectionTitle>Fan devotion</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("💗", "Rookie Fan", fanLevel >= 5, "Reach Fan Lv.5")}
                {badge("💜", "Devoted Fan", fanLevel >= 10, "Reach Fan Lv.10")}
                {badge("👑", "Ultimate Bias", fanLevel >= 20, "Reach Fan Lv.20")}
                {badge("🐺", "VICIOUS Legend", fanLevel >= 30, "Reach Fan Lv.30")}
              </div>
            </div>

            {/* Collector */}
            <div>
              <SectionTitle>Collector</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("🥉", "Bronze Coll.", uniqueCards >= 25, "Collect 25 unique cards")}
                {badge("🥈", "Silver Coll.", uniqueCards >= 50, "Collect 50 unique cards")}
                {badge("🥇", "Gold Coll.", uniqueCards >= 100, "Collect 100 unique cards")}
                {badge("💠", "Diamond Coll.", completeSets >= 4, "Complete every set")}
              </div>
            </div>

            {/* Streak */}
            <div>
              <SectionTitle>Streak</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("🔥", "7-Day Flame", streak >= 7, "Maintain a 7-day streak")}
                {badge("🌙", "30-Day Devotion", streak >= 30, "Maintain a 30-day streak")}
              </div>
            </div>

            {/* Secret hunt & trading */}
            <div>
              <SectionTitle>Secret hunt & trading</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("🌟", "Secret Hunter", false, "Own every secret from one set")}
                {badge("🔄", "First Trade", false, "Complete a P2P trade")}
              </div>
            </div>
          </div>
        </SystemWindow>

        {/* Right column: Collection + Purchase history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SystemWindow title="Collection" width="100%">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {packProgression.map((pack) => {
                const pct = pack.total > 0 ? Math.round((pack.ownedCount / pack.total) * 100) : 0;
                return (
                  <div key={pack.code} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {(() => {
                      const pi = getPackInfo(pack.code);
                      return (
                        <div style={{
                          width: 40, height: 52, borderRadius: 6, flexShrink: 0,
                          background: pi?.coverImage ? "none" : "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                          border: "1.5px solid var(--text-primary)", overflow: "hidden",
                        }}>
                          {pi?.coverImage && (
                            <img src={pi.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{pack.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>
                          {pack.ownedCount}/{pack.total}
                        </span>
                      </div>
                      <div style={{
                        width: "100%", height: 6, borderRadius: 3, marginTop: 5,
                        background: "rgba(var(--text-primary-rgb),0.06)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, var(--accent-hotpink), var(--accent-purple))",
                          transition: "width 0.4s",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SystemWindow>

          <SystemWindow title="Purchase history" width="100%">
            <PurchaseHistory />
          </SystemWindow>
        </div>
      </div>

      {/* ─── Bias Picker ─── */}
      <div style={{
        width: "100%", display: "flex", flexDirection: "column", gap: 12,
        padding: 20, borderRadius: 16,
        background: "rgba(var(--surface-white-rgb),0.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,158,196,0.08)",
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

      {/* ─── Account ─── */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.3)", border: "1px solid rgba(255,158,196,0.06)" }}>
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

      {!user && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.3)", border: "1px solid rgba(255,158,196,0.06)" }}>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
      textTransform: "uppercase", color: "var(--text-disabled)",
    }}>
      {children}
    </div>
  );
}
