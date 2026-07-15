"use client";

import CARDS, { getCardsByPack, getPackInfo } from "@/data/cards";
import { GROUPS, findGroupByMember } from "@/data/artists";
import { BIAS_COOLDOWN_DAYS, getFanLevel, STREAK_TICKETS, STREAK_BONUS_GEMS } from "@/lib/gameConfig";
import { useEffect, useState, useMemo } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import SystemWindow from "@/components/SystemWindow";
import ContactModal from "@/components/ContactModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

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

  const todayIdx = streak % 7;
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

  const [selectedGroup, setSelectedGroup] = useState<string>(GROUPS[0]?.id ?? "");
  const [showContact, setShowContact] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                color: "var(--accent-hotpink)", fontSize: 10, fontWeight: 700,
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
              Bias: {bias || "None"}{bias ? ` · ${findGroupByMember(bias)?.name ?? "VICIOUS"}` : ""}
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

      {/* ─── Daily login card ─── */}
      <div style={{
        background: "var(--surface-white)",
        border: "2px solid var(--text-primary)",
        boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
        borderRadius: 14, padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 18, fontWeight: 700 }}>
              {canClaimDaily ? streak : Math.max(streak - 1, 0) || streak}-day streak
            </span>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
            Weekly reset
          </span>
        </div>

        {/* 7 day cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const dayTickets = STREAK_TICKETS[i];
            const dayGems = STREAK_BONUS_GEMS[i];
            const isPast = i < todayIdx;
            const isToday = i === todayIdx && todayIdx >= 0;
            const isFuture = i > todayIdx;
            const isJackpot = i === 6;

            const rewardStr = dayTickets > 0 && dayGems > 0
              ? `${dayTickets}🎟️ ${dayGems}💎`
              : dayTickets > 0 ? `${dayTickets}🎟️`
              : dayGems > 0 ? `${dayGems}💎`
              : "—";

            let bg = "rgba(var(--text-primary-rgb),0.04)";
            let border = "1.5px solid rgba(var(--text-primary-rgb),0.12)";
            let shadow = "none";
            let statusText = "";
            let statusColor = "var(--text-disabled)";
            let rewardSize = 14;
            let opacity = 0.85;

            if (isPast) {
              bg = "rgba(var(--accent-hotpink),0.07)";
              border = "1.5px solid rgba(var(--accent-hotpink),0.25)";
              statusText = "✓";
              statusColor = "var(--accent-hotpink)";
              opacity = 0.9;
            }
            if (isToday) {
              bg = "linear-gradient(180deg, rgba(255,20,147,0.12), rgba(201,177,255,0.12))";
              border = "2px solid var(--accent-hotpink)";
              shadow = "0 0 0 3px rgba(255,20,147,0.15)";
              statusText = "TODAY";
              statusColor = "var(--accent-hotpink)";
              opacity = 1;
              rewardSize = 16;
            }
            if (isFuture) {
              opacity = 0.7;
              statusText = "🔒";
            }

            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "8px 2px", borderRadius: 10,
                background: bg, border, boxShadow: shadow, opacity, position: "relative",
              }}>
                {isJackpot && isToday && (
                  <span style={{
                    position: "absolute", top: -6, right: -4, fontSize: 8, fontWeight: 800,
                    background: "linear-gradient(135deg, #DAA520, #FFD700)", color: "var(--text-primary)",
                    padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-sans, monospace)",
                    letterSpacing: "0.5px",
                  }}>
                    ⭐ JACKPOT
                  </span>
                )}

                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
                  color: isToday ? "var(--accent-hotpink)" : "var(--text-muted)",
                  lineHeight: 1,
                }}>
                  Day {i + 1}
                </span>

                <span style={{
                  fontSize: rewardSize, fontWeight: 800, fontFamily: "var(--font-display, cursive)",
                  color: isToday ? "var(--text-primary)" : "var(--text-muted)",
                  lineHeight: 1.1, letterSpacing: "-0.3px",
                  display: "flex", alignItems: "center", gap: 2, flexWrap: "nowrap",
                }}>
                  {rewardStr}
                </span>

                <span style={{
                  fontSize: 9, fontWeight: 700, color: statusColor,
                  fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px",
                  marginTop: isPast ? 0 : 1,
                }}>
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>

        {/* Claim button */}
        <button
          onClick={handleClickDaily}
          disabled={!canClaimDaily || claimingStreak}
          style={{
            padding: "14px 0", borderRadius: 12, border: "none", cursor: canClaimDaily ? "pointer" : "default",
            background: canClaimDaily && !claimingStreak
              ? "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))"
              : "rgba(var(--text-primary-rgb),0.06)",
            color: canClaimDaily && !claimingStreak
              ? "var(--surface-white)"
              : "var(--text-disabled)",
            fontSize: 15, fontWeight: 800, fontFamily: "var(--font-sans, monospace)",
            letterSpacing: "1.5px", transition: "all 0.2s",
          }}
        >
          {claimingStreak
            ? "CLAIMING..."
            : canClaimDaily
                ? todayGems > 0 && todayTickets > 0
                  ? `CLAIM DAY ${todayIdx + 1} · +${todayTickets}🎟️ +${todayGems}💎`
                  : todayTickets > 0
                    ? `CLAIM DAY ${todayIdx + 1} · +${todayTickets}🎟️`
                    : todayGems > 0
                      ? `CLAIM DAY ${todayIdx + 1} · +${todayGems}💎`
                      : `CLAIM DAY ${todayIdx + 1}`
                : "COME BACK TOMORROW"}
        </button>
      </div>

      {/* Gift banner removed */}

      {/* ─── Grid Badges + Collection + Bias + Account ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Left: Badges */}
        <SystemWindow title="Badges" width="100%">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <SectionTitle>Founder</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("✦", "Day One", true, "Joined during launch week")}
              </div>
            </div>
            <div>
              <SectionTitle>Fan devotion</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("💗", "Rookie Fan", fanLevel >= 5, "Reach Fan Lv.5")}
                {badge("💜", "Devoted Fan", fanLevel >= 10, "Reach Fan Lv.10")}
                {badge("👑", "Ultimate Bias", fanLevel >= 20, "Reach Fan Lv.20")}
                {badge("🐺", "Legend", fanLevel >= 30, "Reach Fan Lv.30")}
              </div>
            </div>
            <div>
              <SectionTitle>Collector</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("🥉", "Bronze Coll.", uniqueCards >= 25, "Collect 25 unique cards")}
                {badge("🥈", "Silver Coll.", uniqueCards >= 50, "Collect 50 unique cards")}
                {badge("🥇", "Gold Coll.", uniqueCards >= 100, "Collect 100 unique cards")}
                {badge("💠", "Diamond Coll.", completeSets >= 4, "Complete every set")}
              </div>
            </div>
            <div>
              <SectionTitle>Streak</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("🔥", "7-Day Flame", streak >= 7, "Maintain a 7-day streak")}
                {badge("🌙", "30-Day Devotion", streak >= 30, "Maintain a 30-day streak")}
              </div>
            </div>
            <div>
              <SectionTitle>Secret hunt & trading</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {badge("🌟", "Secret Hunter", false, "Own every secret from one set")}
                {badge("🔄", "First Trade", false, "Complete a P2P trade")}
              </div>
            </div>
          </div>
        </SystemWindow>

        {/* Right: Collection + Purchase history + Bias + Account */}
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
                        <div style={{ width: 40, height: 52, borderRadius: 6, flexShrink: 0, background: pi?.coverImage ? "none" : "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", border: "1.5px solid var(--text-primary)", overflow: "hidden" }}>
                          {pi?.coverImage && <img src={pi.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                        </div>
                      );
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{pack.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>{pack.ownedCount}/{pack.total}</span>
                      </div>
                      <div style={{ width: "100%", height: 6, borderRadius: 3, marginTop: 5, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: "linear-gradient(90deg, var(--accent-hotpink), var(--accent-purple))", transition: "width 0.4s" }} />
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

          <SystemWindow title="Choose Your Bias" width="100%">
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
              Your bias gets better odds every time you pull. You can change once every {BIAS_COOLDOWN_DAYS} days.
            </div>
            {biasCooldown !== null && biasCooldown !== undefined && biasCooldown > 0 && (
              <div style={{ fontSize: 11, color: "var(--accent-pink)", fontWeight: 600, marginBottom: 8 }}>
                ⏳ Can change again in {biasCooldown} day(s)
              </div>
            )}
            {GROUPS.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {GROUPS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, cursor: "pointer", border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
                      background: selectedGroup === g.id ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "transparent",
                      color: selectedGroup === g.id ? "var(--text-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-display, cursive)", fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(GROUPS.length > 1 && selectedGroup
                ? GROUPS.find(g => g.id === selectedGroup)?.members ?? []
                : GROUPS.flatMap(g => g.members)
              ).map((member) => {
                const isActive = bias === member.stageName;
                return (
                  <button
                    key={member.id}
                    onClick={() => onSetBias(member.stageName)}
                    style={{
                      padding: "8px 14px", borderRadius: 10, cursor: "pointer", border: "none",
                      outline: isActive ? "2px solid var(--text-primary)" : "1.5px solid rgba(var(--text-primary-rgb),0.12)",
                      outlineOffset: -2,
                      background: isActive ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "rgba(var(--surface-white-rgb),0.6)",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-display, cursive)", fontSize: 13, fontWeight: 700,
                      boxShadow: isActive ? "3px 3px 0px rgba(var(--text-primary-rgb),0.9)" : "none",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {isActive ? "💖 " : ""}{member.stageName}
                    {member.color && !isActive && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: member.color, display: "inline-block" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </SystemWindow>

          <SystemWindow title="Account" width="100%">
            {user ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {user.image && <img src={user.image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => setShowContact(true)}
                    style={{
                      padding: "6px 14px", borderRadius: 8,
                      border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
                      background: "transparent", color: "var(--text-muted)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      fontFamily: "var(--font-sans, monospace)",
                    }}
                  >
                    🆘 Help / Contact
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: "6px 14px", borderRadius: 8,
                      border: "1.5px solid rgba(var(--text-primary-rgb),0.08)",
                      background: "transparent", color: "rgba(var(--text-primary-rgb),0.35)",
                      fontSize: 12, fontWeight: 500, cursor: "pointer",
                      fontFamily: "var(--font-sans, monospace)",
                    }}
                  >
                    Delete account
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                padding: 16, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(255,20,147,0.04), rgba(201,177,255,0.06))",
                border: "1.5px solid var(--accent-hotpink)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🔐</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  Sign in to IdolBias
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.4 }}>
                  Save your progress, sync your collection across devices, and unlock all features.
                </div>
                <Link href="/login" style={{
                  display: "inline-block", padding: "10px 24px", borderRadius: 10,
                  background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                  color: "var(--surface-white)", fontWeight: 800, fontSize: 14, textDecoration: "none",
                  letterSpacing: "1px", fontFamily: "var(--font-sans, monospace)",
                  boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
                }}>
                  SIGN IN
                </Link>
              </div>
            )}
          </SystemWindow>
        </div>
      </div>
      {showContact && <ContactModal onClose={() => setShowContact(false)} initialName={user?.name} initialEmail={user?.email} />}
      {showDeleteConfirm && <DeleteConfirmModal onClose={() => setShowDeleteConfirm(false)} />}
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
