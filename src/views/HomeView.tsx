"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import CARDS, { getAllPacks, getPackDropRates, getCardsByPack, getPackInfo } from "@/data/cards";
import { GROUPS } from "@/data/artists";
import RarityOdds from "@/components/RarityOdds";
import ArrowButton from "@/components/ArrowButton";

const FEATURED_PACKS = getAllPacks()
  .filter(([, p]) => p.tag === "featured");

export default function HomeView({ onGoToShop, streak, owned, bias }: {
  onGoToShop?: () => void;
  streak: number;
  owned?: Record<string, number>;
  bias?: string | null;
}) {
  const unlocked = owned ? CARDS.filter((c) => (owned[c.id] ?? 0) > 0).length : 0;
  const total = CARDS.length;
  const completionPct = total > 0 ? (unlocked / total) * 100 : 0;

  // ─── Featured pack carousel ───────────────────────────────────────────────

  const [carouselIdx, setCarouselIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef(0);

  const goTo = useCallback((i: number) => {
    setCarouselIdx((i + FEATURED_PACKS.length) % FEATURED_PACKS.length);
  }, []);
  const next = useCallback(() => goTo(carouselIdx + 1), [carouselIdx, goTo]);
  const prev = useCallback(() => goTo(carouselIdx - 1), [carouselIdx, goTo]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    if (FEATURED_PACKS.length < 2) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const [fcCode, fcPack] = FEATURED_PACKS[carouselIdx] ?? [];
  const fcCards = fcCode ? getCardsByPack(fcCode) : [];
  const fcGroup = fcCards[0]?.group;


  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) { dx > 0 ? prev() : next(); resetTimer(); }
  };

  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[1100px]"
      style={{ padding: "24px 16px 0", display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* ─── Header ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ IdolBias
        </span>
        <h1 style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px",
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--surface-white))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          margin: 0, lineHeight: 1.1,
        }}>
          your next bias
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          Collect your favorite virtual K-pop idol photocards. Every pull is a surprise ✨
        </span>
      </div>

      {/* ─── Featured pack carousel (même layout que ShopView) ─── */}
      {fcPack && (
        <div style={{ position: "relative" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div style={{
            borderRadius: 20, overflow: "hidden", position: "relative",
            border: "2px solid var(--text-primary)", boxShadow: "5px 5px 0px rgba(var(--text-primary-rgb),0.9)", height: "min(280px, 50vw)",
          }}>
            <img src={fcPack.bannerImage ?? ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.05) 0%, rgba(var(--text-primary-rgb),0.78) 100%)" }} />

            {/* Top badge — same as ShopView */}
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4, alignItems: "center", zIndex: 2, pointerEvents: "none" }}>
              {fcPack.tag && (
                <span style={{
                  display: "inline-block", padding: "3px 8px", borderRadius: 6,
                  background: fcPack.tag === "featured" ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
                    : fcPack.tag === "limited" ? "var(--text-primary)"
                    : fcPack.tag === "discount" ? "var(--accent-hotpink)"
                    : "var(--holo-c)",
                  color: fcPack.tag === "featured" ? "var(--text-primary)"
                    : "var(--surface-white)",
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.5px",
                  fontFamily: "var(--font-sans, monospace)",
                  border: "2px solid var(--text-primary)",
                  boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
                  transform: "rotate(-3deg)",
                  whiteSpace: "nowrap",
                }}>
                  {fcPack.tag === "featured" ? "★ FEATURED"
                    : fcPack.tag === "limited" ? "LIMITED EDITION"
                    : fcPack.tag === "discount" ? `-${fcPack.discountPercent ?? 50}%`
                    : "✦ NEW"}
                </span>
              )}
            </div>

            {/* Bottom content row — same layout as ShopView */}
            <div style={{
              position: "absolute", bottom: 10, left: 10, right: 10,
              display: "flex", alignItems: "flex-end", gap: 8,
              pointerEvents: "none", zIndex: 4,
            }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0, pointerEvents: "none" }}>
                {fcGroup && (
                  <span style={{
                    fontWeight: 800, letterSpacing: "1px",
                    color: GROUPS.find(g => g.name === fcGroup)?.gender === "male" ? "#4A90D9" : "var(--accent-pink)",
                    textTransform: "uppercase", fontFamily: "var(--font-sans, monospace)",
                    fontSize: "clamp(14px, 3.5vw, 20px)",
                  }}>
                    {fcGroup}
                  </span>
                )}
                <span style={{
                  fontFamily: "var(--font-display, cursive)", fontWeight: 700,
                  color: "var(--surface-white)", textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.4)",
                  fontSize: "clamp(18px, 5vw, 26px)",
                }}>
                  {fcPack.name}
                </span>
                <span style={{
                  color: "rgba(var(--surface-white-rgb),0.75)", letterSpacing: "1px",
                  fontFamily: "var(--font-sans, monospace)", fontWeight: 600,
                  fontSize: "clamp(10px, 2.5vw, 12px)",
                }}>
                  {fcPack.edition.toUpperCase()} · {fcCards.length} CARDS
                </span>
                <RarityOdds dropRates={fcPack.dropRates} variant="banner" />
              </div>
            </div>

            {/* Click overlay on top of everything → shop view */}
            <div onClick={() => onGoToShop?.()} style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }} />

            {/* Dots inside banner (same as ShopView) */}
            {FEATURED_PACKS.length > 1 && (
              <div style={{
                position: "absolute", bottom: 4, left: "50%", translate: "-50% 0", zIndex: 3,
                display: "flex", gap: 4, pointerEvents: "none",
              }}>
                {FEATURED_PACKS.map((_, i) => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: i === carouselIdx ? "var(--surface-white)" : "rgba(var(--surface-white-rgb),0.35)",
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Arrows — outside overflow:hidden */}
          {FEATURED_PACKS.length > 1 && (
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
      )}

      {/* ─── Collection progress ─── */}
      <div style={{
        padding: "14px 18px", borderRadius: 14, background: "rgba(var(--surface-white-rgb),0.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "2px solid rgba(255,158,196,0.04)",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Collection
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>
            {owned ? `${unlocked}/${total}` : `${total} cards`}
          </span>
        </div>
        <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
          <div style={{ width: `${completionPct}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--accent-hotpink), var(--accent-purple))", transition: "width 0.3s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-disabled)", fontWeight: 500 }}>
            {owned ? (bias ? `Bias: ${bias}` : "") : `${GROUPS.length} groups`}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-disabled)", fontWeight: 500 }}>
            {completionPct.toFixed(0)}% complete
          </span>
        </div>
      </div>

      {/* ─── Updates ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
          ✦ Updates
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(() => {
            const featured = getAllPacks().filter(([, p]) => p.tag === "featured" || p.tag === "new");
            const oddsPack = getAllPacks().find(([, p]) => !p.locked);
            const items: Array<{ title: string; desc: string; tag: string }> = [];
            for (const [code, pack] of featured) {
              const c = getCardsByPack(code);
              const cardCount = c.length;
              items.push({
                title: `${pack.name} is live!`,
                desc: `${cardCount} cards across ${new Set(c.map((x) => x.idol)).size} idols. Collect them all!`,
                tag: "new",
              });
            }
            if (oddsPack) {
              const [, p] = oddsPack;
              const d = p.dropRates;
              const total = d.common + d.rare + d.epic + d.legendary + d.secret;
              const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
              items.push({
                title: `Standard odds: Common ${pct(d.common)} · Rare ${pct(d.rare)} · Epic ${pct(d.epic)} · Legendary ${pct(d.legendary)} · Secret ${pct(d.secret)}`,
                desc: `Legendary at ${pct(d.legendary)}, Secret at ${pct(d.secret)}. Good luck!`,
                tag: "odds",
              });
            }
            return items;
          })().map((news) => (
              <div key={news.title} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", background: "rgba(var(--surface-white-rgb),0.5)",
                backdropFilter: "blur(12px)", borderRadius: 12, border: "2px solid rgba(255,158,196,0.02)",
              }}>
                <span style={{
                  flexShrink: 0, padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                  letterSpacing: "1px", textTransform: "uppercase",
                  background: news.tag === "new" ? "rgba(255,158,196,0.08)" : "rgba(201,177,255,0.06)",
                  color: news.tag === "new" ? "var(--accent-pink)" : "var(--accent-purple)",
                }}>
                  {news.tag}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{news.title}</span>
                  <span style={{ fontSize: 15, color: "var(--text-muted)" }}>{news.desc}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
