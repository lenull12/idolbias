
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import PillBar from "@/components/PillBar";
import StyledSelect from "@/components/StyledSelect";
import CARDS, { getAllPacks, getCardsByPack, rarityFromReference } from "@/data/cards";
import type { PackInfo, PackTag, PackDropRates, CardEntry } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import { RARITY_ORDER } from "@/lib/gameConfig";
import RarityOdds from "@/components/RarityOdds";
import { GROUPS } from "@/data/artists";
import RaffleTicketBadge from "@/components/RaffleTicketBadge";
import HeroPullSlot from "@/components/HeroPullSlot";
import PackPriceAction from "@/components/PackPriceAction";
import GemShopSection from "@/components/shop/GemShopSection";
import ArrowButton from "@/components/ArrowButton";
import EventCountdown from "@/components/EventCountdown";

const RARITY_LETTER: Record<Rarity, string> = {
  common: "C", rare: "R", epic: "E", legendary: "L", secret: "S",
};


const BADGE_CONFIG: Record<PackTag, { label: (p: PackInfo) => string; bg: string; fg: string }> = {
  featured: { label: () => "★ FEATURED", bg: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", fg: "var(--text-primary)" },
  limited: { label: () => "LIMITED EDITION", bg: "var(--text-primary)", fg: "var(--surface-white)" },
  discount: { label: (p) => `-${p.discountPercent ?? 50}%`, bg: "var(--accent-hotpink)", fg: "var(--surface-white)" },
  new: { label: () => "✦ NEW", bg: "var(--holo-c)", fg: "var(--text-primary)" },
};

// ─── Countdown ──────────────────────────────────────────────────────────────

function useCountdown(endsAt?: string): string | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) { setRemaining(null); return; }
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt || remaining === null) return null;
  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ─── Badge sticker ──────────────────────────────────────────────────────────

function PackBadge({ pack, size = "md" }: { pack: PackInfo; size?: "sm" | "md" }) {
  if (!pack.tag) return null;
  const cfg = BADGE_CONFIG[pack.tag];
  return (
    <span style={{
      display: "inline-block",
      padding: size === "sm" ? "3px 8px" : "4px 10px",
      borderRadius: 6,
      background: cfg.bg,
      color: cfg.fg,
      fontSize: size === "sm" ? 9 : 11,
      fontWeight: 800,
      letterSpacing: "0.5px",
      fontFamily: "var(--font-sans, monospace)",
      border: "2px solid var(--text-primary)",
      boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
      transform: "rotate(-3deg)",
      whiteSpace: "nowrap",
    }}>
      {cfg.label(pack)}
    </span>
  );
}

// ─── Artwork avec placeholder gracieux ─────────────────────────────────────

function PackArt({ src, alt, locked }: { src?: string; alt: string; locked?: boolean }) {
  if (locked) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(var(--text-primary-rgb),0.06)",
      }}>
        <span style={{ fontSize: 22, opacity: 0.3 }}>🔒</span>
      </div>
    );
  }
  if (!src) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 35%, var(--holo-c) 70%, var(--holo-d) 100%)",
      }}>
        <span style={{ fontSize: 26, color: "var(--surface-white)" }}>✦</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

// ─── Drop rates component ────────────────────────────────────────────────────
// (imported from @/components/RarityOdds)

const RARITY_BAR_COLOR: Record<Rarity, string> = {
  common: "var(--rarity-common-graphic)", rare: "var(--accent-pink)", epic: "var(--accent-purple)", legendary: "var(--rarity-legendary-badge)", secret: "var(--text-primary)",
};

  // ─── Segmented drop rates bar ──────────────────────────────────────────────

function RarityBar({ dropRates }: { dropRates: PackDropRates }) {
  const total = RARITY_ORDER.reduce((s, r) => s + dropRates[r], 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 6, overflow: "hidden", border: "2px solid var(--text-primary)" }}>
        {RARITY_ORDER.map((r) => {
          const pct = total > 0 ? (dropRates[r] / total) * 100 : 0;
          if (pct <= 0) return null;
          return <div key={r} style={{ width: `${pct}%`, background: RARITY_BAR_COLOR[r] }} />;
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {RARITY_ORDER.map((r) => {
          const pct = total > 0 ? (dropRates[r] / total) * 100 : 0;
          return (
            <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: RARITY_BAR_COLOR[r] }} />
              {RARITY_LETTER[r]} {pct.toFixed(0)}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chase cards (meilleure rareté par membre, exclut secret) ───────────────

function getChaseCards(cards: CardEntry[]) {
  return cards.map((c) => ({ card: c, rarity: rarityFromReference(c.reference) }));
}

function ChaseCardCarousel({ chase }: { chase: ReturnType<typeof getChaseCards> }) {
  if (chase.length === 0) return null;
  // 1 carte par membre avec la meilleure rareté (secret exclue)
  const bestPerMember = Array.from(
    chase
      .filter((c) => c.rarity !== "secret")
      .reduce((map, c) => {
        const existing = map.get(c.card.idol);
        if (!existing || RARITY_ORDER.indexOf(c.rarity) > RARITY_ORDER.indexOf(existing.rarity)) {
          map.set(c.card.idol, c);
        }
        return map;
      }, new Map<string, typeof chase[0]>())
      .values()
  );
  if (bestPerMember.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase" }}>
        Featured cards
      </span>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {bestPerMember.map(({ card }) => (
          <div key={card.id} style={{
            position: "relative", flex: "0 0 auto", width: "min(112px, 28vw)", aspectRatio: "896/1152",
            borderRadius: 12, overflow: "hidden", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
            boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
          }}>
            <img src={card.imageSrc} alt={card.idol} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <span style={{
              position: "absolute", bottom: 4, left: 4, right: 4, fontSize: 9, fontWeight: 800,
              letterSpacing: "0.5px", textAlign: "center", color: "var(--surface-white)",
              textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.9)", fontFamily: "var(--font-sans, monospace)",
            }}>
              ★ {card.idol}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

  // ─── "About" block (group, members, style, lore) ────────────────────────────

function findMemberColor(stageName: string): string {
  for (const g of GROUPS) {
    const m = g.members.find((mem) => mem.stageName === stageName);
    if (m) return m.color;
  }
  return "var(--accent-purple)";
}

function findMemberProfile(stageName: string): string | undefined {
  for (const g of GROUPS) {
    const m = g.members.find((mem) => mem.stageName === stageName);
    if (m?.profileImage) return m.profileImage;
  }
}

function PackAbout({ pack, cards }: { pack: PackInfo; cards: CardEntry[] }) {
  const group = cards[0]?.group;
  const idols = Array.from(new Set(cards.map((c) => c.idol)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {group && (
        <span style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 20, fontWeight: 800,
          color: GROUPS.find(g => g.name === group)?.gender === "male" ? "#4A90D9" : "var(--accent-pink)", letterSpacing: "0.5px",
        }}>
          {group}
        </span>
      )}
      {pack.tags && pack.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {pack.tags.map((t) => (
            <span key={t} style={{
              padding: "2px 8px", borderRadius: 6, background: "rgba(201,177,255,0.15)",
              color: "var(--lilac-text-tint)", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
              fontFamily: "var(--font-sans, monospace)",
            }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {idols.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {idols.map((name) => {
            const pfp = findMemberProfile(name);
            const color = findMemberColor(name);
            return (
              <div key={name} title={name} style={{
                width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
                background: pfp ? "none" : color,
                border: "2px solid var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pfp ? (
                  <img src={pfp} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--surface-white)", fontFamily: "var(--font-sans, monospace)" }}>
                    {name[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {pack.description && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
          {pack.description}
        </p>
      )}
    </div>
  );
}

// WalletPill moved to components/WalletPill.tsx (shared)

  // ─── Pack detail modal ─────────────────────────────────────────────────────

function PackDetailModal({ code, pack, tickets, gems, bias, onPull, onClose, onGoToGemShop }: {
  code: string; pack: PackInfo; tickets: number; gems: number; bias: string | null;
  onPull: (method: "tickets" | "gems") => void; onClose: () => void;
  onGoToGemShop?: () => void;
}) {
  const cards = getCardsByPack(code);
  const chase = getChaseCards(cards);
  const countdown = useCountdown(pack.endsAt);
  const hasBias = bias !== null && cards.some((c) => c.idol === bias);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(250,245,249,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        cursor: "pointer", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
          background: "var(--surface-white)", borderRadius: 20, border: "2px solid var(--text-primary)",
          boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)", cursor: "default",
          animation: "modalIn 0.2s ease-out",
        }}
      >
        <style>{`@keyframes modalIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }`}</style>

        <div style={{ position: "relative", height: "clamp(180px, 40vw, 300px)", overflow: "visible" }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <PackArt src={pack.bannerImage} alt={pack.name} locked={pack.locked} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.1) 0%, rgba(var(--text-primary-rgb),0.82) 100%)" }} />
          </div>

          {pack.coverImage && !pack.locked && (
            <div style={{
              position: "absolute", bottom: -36, left: 24,
              width: 120, aspectRatio: "896/1152", borderRadius: 12,
              overflow: "hidden", border: "3px solid var(--surface-white)",
              boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
              transform: "rotate(-6deg)", zIndex: 2,
            }}>
              <img src={pack.coverImage} alt={pack.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          )}


          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, zIndex: 2 }}>
            {pack.tag && <PackBadge pack={pack} />}
            {hasBias && (
              <span style={{
                display: "inline-block", padding: "4px 10px", borderRadius: 6,
                background: "var(--surface-white)", color: "var(--accent-hotpink)", fontSize: 11, fontWeight: 800,
                fontFamily: "var(--font-sans, monospace)", border: "2px solid var(--text-primary)",
                boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)", transform: "rotate(2deg)", whiteSpace: "nowrap",
              }}>
                💖 YOUR BIAS
              </span>
            )}
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 8,
              border: "2px solid var(--text-primary)", background: "var(--surface-white)", cursor: "pointer",
              fontSize: 13, fontWeight: 700, lineHeight: "22px", padding: 0,
            }}>✕</button>
          </div>
          <div style={{ position: "absolute", bottom: 14, left: pack.coverImage && !pack.locked ? 156 : 18, right: 18, zIndex: 2 }}>
            <span style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 28, fontWeight: 700,
              color: "var(--surface-white)", textShadow: "2px 2px 0 rgba(var(--text-primary-rgb),0.4)",
            }}>
              {pack.name}
            </span>
          </div>
        </div>

        <div style={{ padding: "44px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {pack.locked ? (
            <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              This pack isn't available yet. Check back soon ✨
            </span>
          ) : (
            <>
              {/* ─── Pack description ─── */}
              <PackAbout pack={pack} cards={cards} />

              {/* ─── Discount / limited banners ─── */}
              {pack.tag === "discount" && pack.originalCostGems !== undefined && pack.costGems !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10,                   background: "rgba(255,20,147,0.06)", border: "2px dashed var(--accent-hotpink)"  }}>
                  <span style={{ fontSize: 16 }}>💸</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-hotpink)", fontFamily: "var(--font-sans, monospace)" }}>
                    You save {pack.originalCostGems - pack.costGems} 💎 on this pack
                  </span>
                </div>
              )}
              {pack.tag === "limited" && countdown && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10,                   background: "rgba(var(--text-primary-rgb),0.04)", border: "2px dashed var(--text-primary)"  }}>
                  <span style={{ fontSize: 16 }}>⏳</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans, monospace)" }}>
                    Ends in {countdown} — won't be back
                  </span>
                </div>
              )}

              {/* ─── CTA ─── */}
              <div style={{ display: "flex", gap: 10 }}>
                {pack.costTickets !== undefined && (
                  <button onClick={() => onPull("tickets")} disabled={tickets < pack.costTickets} style={{
                    flex: 1, padding: 14, borderRadius: 12, border: "2px solid var(--text-primary)",
                    fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans, monospace)",
                    cursor: tickets >= pack.costTickets ? "pointer" : "default",
                    boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
                    background: "#fff", color: tickets >= pack.costTickets ? "var(--text-primary)" : "var(--text-disabled)",
                    opacity: tickets >= pack.costTickets ? 1 : 0.4,
                  }}>
                    🎟️ {pack.costTickets} Ticket{pack.costTickets > 1 ? "s" : ""}
                  </button>
                )}
                {pack.costGems !== undefined && gems >= pack.costGems && (
                  <button onClick={() => onPull("gems")} style={{
                    flex: 1, padding: 14, borderRadius: 12, border: "2px solid var(--text-primary)",
                    fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans, monospace)",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
                    background: "var(--accent-hotpink)", color: "#fff",
                  }}>
                    💎 {pack.costGems} Gems
                  </button>
                )}
                {pack.costGems !== undefined && gems < pack.costGems && (
                  <button onClick={onGoToGemShop} style={{
                    flex: 1, padding: 14, borderRadius: 12, border: "2px solid var(--text-primary)",
                    fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans, monospace)",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
                    background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                    color: "#fff",
                  }}>
                    💎 GET GEMS
                  </button>
                )}
              </div>

              {/* ─── Chase cards ─── */}
              {chase.length > 0 && (
                <>
                  <div style={{ height: 1, background: "rgba(var(--text-primary-rgb),0.06)", margin: "4px 0" }} />
                  <ChaseCardCarousel chase={chase} />
                </>
              )}

              {/* ─── What's in this pack ─── */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                  ★ What's in this pack
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 36, lineHeight: 1, color: "var(--text-primary)" }}>
                    {cards.length}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                    unique cards to collect
                  </span>
                </div>
                {RARITY_ORDER.map((r) => {
                  const count = cards.filter(c => rarityFromReference(c.reference) === r).length;
                  if (count === 0) return null;
                  const pct = pack.dropRates[r] ?? 0;
                  const chips: Record<string, { symbol: string; bg: string; nameColor: string }> = {
                    common: { symbol: "●", bg: "rgba(var(--text-primary-rgb),0.08)", nameColor: "var(--text-muted)" },
                    rare: { symbol: "◆", bg: "var(--accent-pink)", nameColor: "var(--accent-hotpink)" },
                    epic: { symbol: "✦", bg: "var(--accent-purple)", nameColor: "var(--accent-purple)" },
                    legendary: { symbol: "★", bg: "var(--rarity-legendary-badge)", nameColor: "#8a6a1f" },
                    secret: { symbol: "✧", bg: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", nameColor: "transparent" },
                  };
                  const ch = chips[r];
                  const bgColors: Record<string, string> = {
                    common: "rgba(var(--text-primary-rgb),0.03)",
                    rare: "rgba(255,20,147,0.05)",
                    epic: "rgba(201,177,255,0.10)",
                    legendary: "linear-gradient(90deg, rgba(232,182,90,0.14), rgba(232,182,90,0.05))",
                    secret: "linear-gradient(90deg, rgba(255,20,147,0.08), rgba(201,177,255,0.10), rgba(158,230,255,0.08))",
                  };
                  const borders: Record<string, string> = {
                    epic: "2px solid rgba(201,177,255,0.3)",
                    legendary: "2px solid rgba(232,182,90,0.45)",
                    secret: "2px solid var(--text-primary)",
                  };
                  const boxShadows: Record<string, string> = {
                    secret: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
                  };
                  return (
                    <div key={r} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 10, marginBottom: 6,
                      background: bgColors[r] || "transparent",
                      border: borders[r] || "none",
                      boxShadow: boxShadows[r] || "none",
                      position: "relative", overflow: "hidden",
                    }}>
                      {(r === "legendary" || r === "secret") && (
                        <div style={{
                          position: "absolute", top: 0, bottom: 0, width: "40%",
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                          animation: "shineSweep 3.5s ease-in-out infinite",
                          transform: "translateX(-120%) skewX(-15deg)",
                        }} />
                      )}
                      <style>{`
                        @keyframes shineSweep { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
                      `}</style>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, flexShrink: 0,
                          background: ch.bg, color: "#fff",
                        }}>
                          {ch.symbol}
                        </div>
                        <span style={{
                          fontSize: 12.5, fontWeight: 800, letterSpacing: "0.5px",
                          textTransform: "uppercase", fontFamily: "var(--font-sans, monospace)",
                          color: ch.nameColor,
                          ...(r === "secret" ? {
                            backgroundImage: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple), var(--holo-c))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                          } : {}),
                        }}>
                          {r}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans, monospace)" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                          {count} card{count > 1 ? "s" : ""}
                        </span>
                        <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hero : pack mis en avant ───────────────────────────────────────────────

function FeaturedPackCard({ featuredPacks, tickets, gems, bias, onPull, onPreview }: {
  featuredPacks: Array<[string, PackInfo]>; tickets: number; gems: number; bias: string | null;
  onPull: (code: string, method: "tickets" | "gems") => void; onPreview: (code: string) => void;
}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef(0);
  const goTo = useCallback((i: number) => {
    setCurrent((i + featuredPacks.length) % featuredPacks.length);
  }, [featuredPacks.length]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    if (featuredPacks.length < 2) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer, featuredPacks.length]);

  const [code, pack] = featuredPacks[current];
  const countdown = useCountdown(pack.endsAt);
  const cards = getCardsByPack(code);
  const chase = getChaseCards(cards);
  const group = cards[0]?.group;
  const hasBias = bias !== null && cards.some((c) => c.idol === bias);

  const defaultMethod = useMemo(() => {
    if (pack.costTickets !== undefined && tickets >= pack.costTickets) return "tickets" as const;
    if (pack.costGems !== undefined && gems >= pack.costGems) return "gems" as const;
    if (pack.costTickets !== undefined) return "tickets" as const;
    if (pack.costGems !== undefined) return "gems" as const;
    return null;
  }, [pack, tickets, gems]);
  const [manualMethod, setManualMethod] = useState<"tickets" | "gems" | null>(null);
  useEffect(() => { setManualMethod(null); }, [code]);
  const selectedMethod = manualMethod ?? defaultMethod;

  const handleBannerClick = () => {
    if (!selectedMethod) { onPreview(code); return; }
    const cost = selectedMethod === "tickets" ? pack.costTickets! : pack.costGems!;
    const balance = selectedMethod === "tickets" ? tickets : gems;
    if (balance >= cost) onPull(code, selectedMethod);
    else onPreview(code);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
      resetTimer();
    }
  };

  return (
    <div style={{ position: "relative" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{
        borderRadius: 20, overflow: "hidden", position: "relative",
        border: "2px solid var(--text-primary)", boxShadow: "5px 5px 0px rgba(var(--text-primary-rgb),0.9)", height: "min(280px, 50vw)",
      }}>
        <PackArt src={pack.bannerImage} alt={pack.name} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.05) 0%, rgba(var(--text-primary-rgb),0.78) 100%)" }} />

        {/* Top badge */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4, alignItems: "center", zIndex: 2, pointerEvents: "none" }}>
          <PackBadge pack={pack} />
          {hasBias && (
            <span style={{
              padding: "2px 8px", borderRadius: 5, background: "var(--surface-white)", color: "var(--accent-hotpink)",
              fontSize: 10, fontWeight: 800, fontFamily: "var(--font-sans, monospace)",
              border: "2px solid var(--text-primary)", whiteSpace: "nowrap",
            }}>
              💖 YOUR BIAS
            </span>
          )}
        </div>

        {/* Bottom content row */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, right: 10,
          display: "flex", alignItems: "flex-end", gap: 8,
          pointerEvents: "none", zIndex: 4,
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0, pointerEvents: "none" }}>
            {group && (
              <span style={{
                fontWeight: 800, letterSpacing: "1px",
                color: GROUPS.find(g => g.name === group)?.gender === "male" ? "#4A90D9" : "var(--accent-pink)",
                textTransform: "uppercase", fontFamily: "var(--font-sans, monospace)",
                fontSize: "clamp(14px, 3.5vw, 20px)",
              }}>
                {group}
              </span>
            )}
            <span style={{
              fontFamily: "var(--font-display, cursive)", fontWeight: 700,
              color: "var(--surface-white)", textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.4)",
              fontSize: "clamp(18px, 5vw, 26px)",
            }}>
              {pack.name}
            </span>
            <span style={{
              color: "rgba(var(--surface-white-rgb),0.75)", letterSpacing: "1px",
              fontFamily: "var(--font-sans, monospace)", fontWeight: 600,
              fontSize: "clamp(10px, 2.5vw, 12px)",
            }}>
              {pack.edition.toUpperCase()} · {cards.length} CARDS
            </span>
            <span className="hidden sm:block">
              <RarityOdds dropRates={pack.dropRates} variant="banner" />
            </span>
            <span className="block sm:hidden">
              <RarityOdds dropRates={pack.dropRates} size="sm" variant="banner" />
            </span>
          </div>
          <HeroPullSlot
            pack={pack}
            tickets={tickets}
            gems={gems}
            selected={selectedMethod ?? "tickets"}
            onSelect={setManualMethod}
            onPull={() => handleBannerClick()}
          />
        </div>

        {/* Countdown */}
        {countdown && (
          <div style={{
            position: "absolute", bottom: 14, right: 10, zIndex: 2,
            background: "rgba(var(--text-primary-rgb),0.6)", borderRadius: 5, padding: "2px 8px",
            fontSize: 10, color: "var(--surface-white)", letterSpacing: "0.5px",
            fontFamily: "var(--font-sans, monospace)", fontWeight: 600, pointerEvents: "none",
          }}>
            ENDS {countdown}
          </div>
        )}

        {/* Chase badge */}
        {chase.filter(c => c.rarity === "secret").length > 0 && (
          <RaffleTicketBadge
            packCode={code}
            secretCount={chase.filter(c => c.rarity === "secret").length}
          />
        )}

        {/* Dots */}
        {featuredPacks.length > 1 && (
          <div style={{
            position: "absolute", bottom: 4, left: "50%", translate: "-50% 0", zIndex: 3,
            display: "flex", gap: 4, pointerEvents: "none",
          }}>
            {featuredPacks.map((_, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i === current ? "var(--surface-white)" : "rgba(var(--surface-white-rgb),0.35)",
              }} />
            ))}
          </div>
        )}

        {/* Click on banner background → details, NOT pull */}
        <div onClick={() => onPreview(code)} style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }} />
      </div>

      {/* Arrows */}
      {featuredPacks.length > 1 && (
        <>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "50%", left: 4, translate: "0 -50%", zIndex: 5 }}>
            <ArrowButton direction="left" variant="overlay" onClick={() => { prev(); resetTimer(); }} size={16} />
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "50%", right: 4, translate: "0 -50%", zIndex: 5 }}>
            <ArrowButton direction="right" variant="overlay" onClick={() => { next(); resetTimer(); }} size={16} />
          </div>
        </>
      )}
    </div>
  );
}

  // ─── Carousel: swipable mini banners ───────────────────────────────────────

function CarouselPackCard({ code, pack, bias, onPreview }: {
  code: string; pack: PackInfo; bias: string | null;
  onPreview: (code: string) => void;
}) {
  const locked = pack.locked;
  const hasBias = !locked && bias !== null && getCardsByPack(code).some((c) => c.idol === bias);
  return (
    <div
      style={{
        position: "relative",
        flex: "0 0 auto",
        width: "min(200px, 42vw)", height: "min(130px, 28vw)",
        borderRadius: 14, overflow: "hidden",
        border: "2px solid var(--text-primary)",
        boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
        scrollSnapAlign: "start",
        opacity: locked ? 0.6 : 1,
      }}
    >
      <div onClick={() => onPreview(code)} style={{ position: "absolute", inset: 0, cursor: "pointer" }}>
        <PackArt src={pack.bannerImage} alt={pack.name} locked={locked} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.05) 0%, rgba(var(--text-primary-rgb),0.72) 100%)",
        }} />
      </div>
      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, pointerEvents: "none" }}>
        <PackBadge pack={pack} size="sm" />
        {hasBias && <span style={{ fontSize: 13 }} title="Your bias is in this pack">💖</span>}
      </div>
      {!locked && (
        <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            onClick={() => onPreview(code)}
            style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 15, fontWeight: 700,
              color: "var(--surface-white)", textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.5)",
              display: "block", cursor: "pointer",
            }}
          >
            {pack.name}
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {pack.costTickets !== undefined && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--surface-white)", fontFamily: "var(--font-sans, monospace)" }}>
                🎟️ {pack.costTickets}
              </span>
            )}
            {pack.costGems !== undefined && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--surface-white)", fontFamily: "var(--font-sans, monospace)" }}>
                💎 {pack.costGems}
              </span>
            )}
            <button
              onClick={() => onPreview(code)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 8, border: "none",
                background: "linear-gradient(120deg, #ffb8dd, #c9b3ff)", color: "#3f2f57",
                fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              View details
            </button>
          </div>
        </div>
      )}
      {locked && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "var(--surface-white)",
            letterSpacing: "1px", fontFamily: "var(--font-sans, monospace)",
          }}>
            🔒 SOON
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Ligne : catalogue complet ──────────────────────────────────────────────

function PackListRow({ code, pack, bias, tickets, gems, onPull, onPreview }: {
  code: string; pack: PackInfo; bias: string | null;
  tickets: number; gems: number;
  onPull: (code: string, method: "tickets" | "gems") => void;
  onPreview: (code: string) => void;
}) {
  const locked = pack.locked;
  const cards = getCardsByPack(code);
  const group = cards[0]?.group;
  const hasBias = !locked && bias !== null && cards.some((c) => c.idol === bias);

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", position: "relative",
      background: locked ? "rgba(var(--text-primary-rgb),0.04)" : undefined,
      border: "2px solid rgba(255,158,196,0.08)", opacity: locked ? 0.6 : 1,
    }}>
      {!locked && pack.bannerImage && (
        <img src={pack.bannerImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {!locked && pack.bannerImage && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.35) 0%, rgba(var(--text-primary-rgb),0.75) 100%)" }} />
      )}
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 16, padding: 16 }}>
        <div onClick={() => onPreview(code)} style={{ display: "flex", gap: 16, flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div style={{ width: "min(88px, 22vw)", height: "min(113px, 28vw)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
            <PackArt src={pack.coverImage ?? pack.bannerImage} alt={pack.name} locked={locked} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minWidth: 0 }}>
            {!locked && group && (
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "1px", color: GROUPS.find(g => g.name === group)?.gender === "male" ? "#4A90D9" : "var(--accent-pink)", textTransform: "uppercase" }}>
                {group}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {pack.tag && <PackBadge pack={pack} size="sm" />}
              <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 17, color: "var(--surface-white)", letterSpacing: "-0.2px", textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.4)" }}>
                {pack.name}
              </span>
              {hasBias && <span style={{ fontSize: 13 }} title="Your bias is in this pack">💖</span>}
            </div>
            <span style={{ fontSize: 13, color: "rgba(var(--surface-white-rgb),0.75)", fontWeight: 500 }}>
              {locked ? "Coming soon" : `${cards.length} cards · ${pack.edition}`}
            </span>
            {!locked && <RarityOdds dropRates={pack.dropRates} size="sm" variant="banner" />}
          </div>
        </div>

        {locked ? (
          <span style={{ alignSelf: "center", flexShrink: 0, padding: "9px 14px", fontSize: 12, fontWeight: 800, color: "var(--text-disabled)" }}>
            LOCKED
          </span>
        ) : (
          <div style={{ alignSelf: "center", flexShrink: 0 }}>
            <PackPriceAction pack={pack} tickets={tickets} gems={gems} size="sm" align="end" onPull={(m) => onPull(code, m)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shop ───────────────────────────────────────────────────────────────────

export default function ShopView({ tickets, gems, bias, onOpenPull, onPurchaseComplete, initialGemsTab, onGemsTabConsumed }: {
  tickets: number;
  gems: number;
  bias: string | null;
  onOpenPull?: (packCode: string, method: "tickets" | "gems") => void;
  onPurchaseComplete?: () => void;
  initialGemsTab?: boolean;
  onGemsTabConsumed?: () => void;
}) {
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<"packs" | "gems">("packs");
  const [activeRateUps, setActiveRateUps] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/events/active", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const all: any[] = [];
        if (data.rateUps) all.push(...data.rateUps);
        if (data.hybrids) all.push(...data.hybrids);
        setActiveRateUps(all);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialGemsTab) { setShopTab("gems"); onGemsTabConsumed?.(); }
  }, [initialGemsTab]);

  const carouselRef = useRef<HTMLDivElement>(null);

  const packs = getAllPacks();
  const featuredPacks = packs.filter(([, p]) => p.tag === "featured");
  const carouselEntries = packs.filter(
    ([code, p]) => !featuredPacks.some(([fc]) => fc === code) && (p.tag === "limited" || p.tag === "discount" || p.tag === "new")
  );
  const previewPack = previewCode ? packs.find(([c]) => c === previewCode)?.[1] : null;

  const packGroups = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    CARDS.forEach((card) => {
      if (!map[card.packCode]) map[card.packCode] = new Set();
      map[card.packCode].add(card.group);
    });
    return map;
  }, []);

  const [packGenderFilter, setPackGenderFilter] = useState("all");
  const [packGroupFilter, setPackGroupFilter] = useState("all");

  useEffect(() => { setPackGroupFilter("all"); }, [packGenderFilter]);

  const packGenderOptions = useMemo(() => {
    const allGroups = new Set(CARDS.map((c) => c.group));
    const groupsWithGender = GROUPS.filter((g) => allGroups.has(g.name));
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Groups" }];
    if (groupsWithGender.some((g) => g.gender === "female")) opts.push({ value: "female", label: "Girl Groups" });
    if (groupsWithGender.some((g) => g.gender === "male")) opts.push({ value: "male", label: "Boy Groups" });
    return opts;
  }, []);

  const packGroupOptions = useMemo(() => {
    const allGroups = new Set(CARDS.map((c) => c.group));
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All" }];
    GROUPS.filter((g) => {
      if (packGenderFilter === "all") return allGroups.has(g.name);
      return allGroups.has(g.name) && g.gender === packGenderFilter;
    }).forEach((g) => opts.push({ value: g.name, label: g.name }));
    return opts;
  }, [packGenderFilter]);

  const filteredPacks = useMemo(() => {
    return packs.filter(([code]) => {
      if (packGenderFilter === "all" && packGroupFilter === "all") return true;
      const groups = packGroups[code];
      if (!groups || groups.size === 0) return true;
      const genderMatch = packGenderFilter === "all" ||
        [...groups].some((g) => GROUPS.find((x) => x.name === g)?.gender === packGenderFilter);
      if (!genderMatch) return false;
      if (packGroupFilter === "all") return true;
      return groups.has(packGroupFilter);
    });
  }, [packs, packGenderFilter, packGroupFilter, packGroups]);

  const handlePull = (code: string, method: "tickets" | "gems") => {
    onOpenPull?.(code, method);
  };

  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[1100px]"
      style={{ padding: "24px 16px 0", display: "flex", flexDirection: "column", gap: 24 }}
    >
      <style>{`
        .shop-carousel::-webkit-scrollbar { display: none; }
        .shop-carousel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Shop
        </span>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px", margin: 0, background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          {shopTab === "packs" ? "available packs" : "get gems"}
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          {shopTab === "packs" ? "Pick a pack and try your luck" : "Buy gems to unlock premium content"}
        </span>
        {bias && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "var(--accent-hotpink)",
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px", marginTop: 2,
          }}>
            🎯 Bias boost active: {bias}
          </span>
        )}
      </div>



      {/* ─── Tab bar ─── */}
      <PillBar
        tabs={[
          { key: "packs" as const, label: "Packs" },
          { key: "gems" as const, label: "Get Gems" },
        ]}
        activeTab={shopTab}
        onTabChange={setShopTab}
      />
      {shopTab === "packs" && (<>
        {/* ─── Rate-up events banner ─── */}
        {activeRateUps.length > 0 && activeRateUps.map((ev) => (
          <div key={ev.id} style={{
            padding: 16, borderRadius: 12,
            border: "2px solid var(--accent-hotpink)",
            background: "linear-gradient(135deg, rgba(255,20,147,0.06), rgba(201,177,255,0.06))",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent-hotpink)" }}>
                  ★ RATE-UP EVENT
                </span>
                <h3 style={{ margin: "4px 0", fontFamily: "var(--font-display)", fontSize: 18 }}>
                  {ev.label}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  {ev.rateUpRarities?.join(", ")}: ×{ev.rateUpMultiplier} chance
                </p>
              </div>
              <EventCountdown endsAt={ev.endsAt} label={ev.label} />
            </div>
          </div>
        ))}

      {/* ─── Pack en avant (carousel) ─── */}
      {featuredPacks.length > 0 && (
        <FeaturedPackCard
          featuredPacks={featuredPacks} tickets={tickets} gems={gems} bias={bias}
          onPull={handlePull} onPreview={setPreviewCode}
        />
      )}

      {/* ─── Carousel horizontal ─── */}

      {carouselEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
            ✦ Limited & special drops
          </span>
          <div style={{ position: "relative" }}>
            <div
              ref={carouselRef}
              className="shop-carousel"
              style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4 }}
            >
              {carouselEntries.map(([code, pack]) => (
                <CarouselPackCard key={code} code={code} pack={pack} bias={bias} onPreview={setPreviewCode} />
              ))}
            </div>
            {carouselEntries.length > 2 && (
              <>
                <div style={{
                  position: "absolute", top: 0, bottom: 4, right: 0, width: 40,
                  background: "linear-gradient(to right, transparent, var(--bg) 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{ position: "absolute", top: "50%", right: 6, transform: "translateY(-50%)" }}>
                  <ArrowButton direction="right" variant="overlay" onClick={() => carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" })} size={14} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Catalogue complet ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
            All packs
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <StyledSelect options={packGenderOptions} value={packGenderFilter} onChange={setPackGenderFilter} />
            <StyledSelect options={packGroupOptions} value={packGroupFilter} onChange={setPackGroupFilter} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredPacks.map(([code, pack]) => (
            <PackListRow key={code} code={code} pack={pack} bias={bias} tickets={tickets} gems={gems} onPull={handlePull} onPreview={setPreviewCode} />
          ))}
        </div>
      </div>

      {/* ─── Info section ─── */}
      <div style={{
        padding: "16px 20px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "2px solid rgba(255,158,196,0.04)", display: "flex", flexDirection: "column", gap: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
          About
        </span>
        <span style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Each pack contains 5 random cards from{" "}
            {GROUPS.map((g, i) => (
              <span key={g.id}>
                {i > 0 && " · "}
                <strong style={{ color: g.gender === "male" ? "#4A90D9" : "var(--accent-pink)" }}>{g.name}</strong>
              </span>
            ))}
            . Rarities range from Common to Secret. Reveal each card one by one by swiping.
        </span>
        <span style={{ fontSize: 15, color: "var(--text-disabled)" }}>
          ✦ New packs and limited editions coming soon
        </span>
      </div>

      </>)}
      {shopTab === "gems" && <GemShopSection gems={gems} onPurchaseComplete={onPurchaseComplete} />}
      {/* ─── Footer ─── */}
      <div style={{
        textAlign: "center", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase",
        color: "var(--text-disabled)", marginTop: 16,
      }}>
        Ⓒ IDOLBIAS — COLLECT YOUR BIAS
      </div>


      {/* ─── Detail modal ─── */}
      {previewPack && previewCode && (
        <PackDetailModal
          code={previewCode}
          pack={previewPack}
          tickets={tickets}
          gems={gems}
          bias={bias}
          onPull={(method) => { handlePull(previewCode, method); setPreviewCode(null); }}
          onClose={() => setPreviewCode(null)}
          onGoToGemShop={() => setShopTab("gems")}
        />
      )}
    </div>
  );
}
