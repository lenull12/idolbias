"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import PillBar from "@/components/PillBar";
import StyledSelect from "@/components/StyledSelect";
import { getAllPacks, getPackInfo, getPackDropRates, getCharacters, type PackInfo, type PackDropRates, type CharacterDef } from "@/data/footballCards";
import type { Rarity } from "@/components/CardEffects";
import { RARITY_ORDER } from "@/lib/gameConfig";

import GemShopSection from "@/components/shop/GemShopSection";
import ArrowButton from "@/components/ArrowButton";
import PackPriceAction from "@/components/PackPriceAction";


const RARITY_LETTER: Record<Rarity, string> = {
  common: "C", rare: "R", epic: "E", legendary: "L", secret: "S",
};

const NATION_FLAG_MAP: Record<string, string> = {
  france: "🇫🇷",
  allemagne: "🇩🇪",
  angleterre: "🇬🇧",
  italie: "🇮🇹",
  espagne: "🇪🇸",
  bresil: "🇧🇷",
  japon: "🇯🇵",
  argentine: "🇦🇷",
};



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

const RARITY_BAR_COLOR: Record<Rarity, string> = {
  common: "var(--rarity-common-graphic)", rare: "var(--accent-pink)", epic: "var(--accent-purple)", legendary: "var(--rarity-legendary-badge)", secret: "var(--text-primary)",
};

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

function ChaseCardCarousel({ characters }: { characters: CharacterDef[] }) {
  if (characters.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase" }}>
        Featured players
      </span>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {characters.map((char) => (
          <div key={char.id} style={{
            position: "relative", flex: "0 0 auto", width: "min(112px, 28vw)", aspectRatio: "896/1152",
            borderRadius: 12, overflow: "hidden", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
            boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
            background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 32, fontWeight: 800, color: "var(--surface-white)",
              fontFamily: "var(--font-display, cursive)",
            }}>
              {char.name[0]}
            </span>
            <span style={{
              position: "absolute", bottom: 4, left: 4, right: 4, fontSize: 9, fontWeight: 800,
              letterSpacing: "0.5px", textAlign: "center", color: "var(--surface-white)",
              textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.9)", fontFamily: "var(--font-sans, monospace)",
            }}>
              ★ {char.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackAbout({ pack, characters }: { pack: PackInfo; characters: CharacterDef[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{
        fontFamily: "var(--font-display, cursive)", fontSize: 20, fontWeight: 800,
        color: "var(--accent-pink)", letterSpacing: "0.5px",
      }}>
        {pack.name}
      </span>
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
      {characters.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {characters.map((char) => (
            <div key={char.id} title={char.name} style={{
              width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
              background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
              border: "2px solid var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--surface-white)", fontFamily: "var(--font-sans, monospace)" }}>
                {char.name[0]}
              </span>
            </div>
          ))}
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

function PackDetailModal({ code, pack, tickets, gems, onPull, onClose, onGoToGemShop }: {
  code: string; pack: PackInfo; tickets: number; gems: number;
  onPull: (method: "tickets" | "gems", pullCount: 1 | 5) => void; onClose: () => void;
  onGoToGemShop?: () => void;
}) {
  const characters = getCharacters();

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

        <div style={{ position: "relative", height: "clamp(120px, 20vw, 160px)", overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 35%, var(--holo-c) 70%, var(--holo-d) 100%)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.1) 0%, rgba(var(--text-primary-rgb),0.82) 100%)" }} />

          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, zIndex: 2 }} />
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 8,
              border: "2px solid var(--text-primary)", background: "var(--surface-white)", cursor: "pointer",
              fontSize: 13, fontWeight: 700, lineHeight: "22px", padding: 0,
            }}>✕</button>
          </div>
          <div style={{ position: "absolute", bottom: 14, left: 18, right: 18, zIndex: 2 }}>
            <span style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 28, fontWeight: 700,
              color: "var(--surface-white)", textShadow: "2px 2px 0 rgba(var(--text-primary-rgb),0.4)",
            }}>
              {pack.name}
            </span>
          </div>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {pack.locked ? (
            <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              This pack isn't available yet. Check back soon ✨
            </span>
          ) : (
            <>
              <PackAbout pack={pack} characters={characters} />

              <PackPriceAction pack={pack} tickets={tickets} gems={gems} size="md" align="center" onPull={(method, pullCount) => onPull(method, pullCount)} />

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
            
              {characters.length > 0 && (
                <>
                  <div style={{ height: 1, background: "rgba(var(--text-primary-rgb),0.06)", margin: "4px 0" }} />
                  <ChaseCardCarousel characters={characters} />
                </>
              )}

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                  ★ What's in this pack
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 36, lineHeight: 1, color: "var(--text-primary)" }}>
                    {characters.length}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                    players to collect
                  </span>
                </div>
                {RARITY_ORDER.map((r) => {
                  const count = characters.length;
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
                          {characters.length} player{characters.length > 1 ? "s" : ""}
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

function FeaturedPackCard({ featuredPacks, tickets, gems, onPull, onPreview }: {
  featuredPacks: Array<[string, PackInfo]>; tickets: number; gems: number;
  onPull: (code: string, method: "tickets" | "gems", pullCount: 1 | 5) => void; onPreview: (code: string) => void;
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
  const characters = getCharacters();

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
    if (balance >= cost) onPull(code, selectedMethod, 1);
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
        background: "linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 35%, var(--holo-c) 70%, var(--holo-d) 100%)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.05) 0%, rgba(var(--text-primary-rgb),0.78) 100%)" }} />

        <div style={{
          position: "absolute", bottom: 10, left: 10, right: 10,
          display: "flex", alignItems: "flex-end", gap: 8,
          pointerEvents: "none", zIndex: 4,
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0, pointerEvents: "none" }}>
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
              {pack.edition.toUpperCase()} · {characters.length} PLAYERS
            </span>
          </div>
        </div>

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

        <div onClick={() => onPreview(code)} style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }} />
      </div>

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

function CarouselPackCard({ code, pack, onPreview }: {
  code: string; pack: PackInfo; onPreview: (code: string) => void;
}) {
  const locked = pack.locked;
  return (
    <div
      onClick={() => onPreview(code)}
      style={{
        position: "relative",
        flex: "0 0 auto",
        width: "min(200px, 42vw)", height: "min(130px, 28vw)",
        borderRadius: 14, overflow: "hidden",
        border: "2px solid var(--text-primary)",
        boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
        scrollSnapAlign: "start",
        opacity: locked ? 0.6 : 1,
        cursor: "pointer",
        background: "linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 35%, var(--holo-c) 70%, var(--holo-d) 100%)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.05) 0%, rgba(var(--text-primary-rgb),0.72) 100%)" }} />
      {!locked && (
        <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{
            fontFamily: "var(--font-display, cursive)", fontSize: 15, fontWeight: 700,
            color: "var(--surface-white)", textShadow: "1px 1px 0 rgba(var(--text-primary-rgb),0.5)",
            display: "block", cursor: "pointer",
          }}>
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
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 8, border: "none",
              background: "linear-gradient(120deg, #ffb8dd, #c9b3ff)", color: "#3f2f57",
              fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700,
              whiteSpace: "nowrap",
            }}>
              View details
            </span>
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

function PackListRow({ code, pack, tickets, gems, onPull, onPreview }: {
  code: string; pack: PackInfo; tickets: number; gems: number;
  onPull: (code: string, method: "tickets" | "gems", pullCount: 1 | 5) => void;
  onPreview: (code: string) => void;
}) {
  const locked = pack.locked;
  const characters = getCharacters();

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", position: "relative",
      background: locked ? "rgba(var(--text-primary-rgb),0.04)" : "linear-gradient(135deg, rgba(255,158,196,0.10), rgba(201,177,255,0.10))",
      border: "2px solid rgba(255,158,196,0.08)", opacity: locked ? 0.6 : 1,
    }}>
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 16, padding: 16 }}>
        <div onClick={() => onPreview(code)} style={{ display: "flex", gap: 16, flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div style={{ width: "min(88px, 22vw)", height: "min(113px, 28vw)", borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32, color: "var(--surface-white)", opacity: 0.6 }}>✦</span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
                {pack.name}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
              {locked ? "Coming soon" : `${characters.length} players · ${pack.edition}`}
            </span>
            {!locked && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>5 cards per pull</span>}
          </div>
        </div>

        {locked ? (
          <span style={{ alignSelf: "center", flexShrink: 0, padding: "9px 14px", fontSize: 12, fontWeight: 800, color: "var(--text-disabled)" }}>
            LOCKED
          </span>
        ) : (
            <PackPriceAction pack={pack} tickets={tickets} gems={gems} size="sm" onPull={(method, count) => onPull(code, method, count)} />
        )}
      </div>
    </div>
  );
}

export default function ShopView({ tickets, gems, onOpenPull, onPurchaseComplete, initialGemsTab, onGemsTabConsumed }: {
  tickets: number;
  gems: number;
  onOpenPull?: (packCode: string, method: "tickets" | "gems", pullCount: 1 | 5) => void;
  onPurchaseComplete?: () => void;
  initialGemsTab?: boolean;
  onGemsTabConsumed?: () => void;
}) {
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<"packs" | "gems">("packs");

  useEffect(() => {
    if (initialGemsTab) { setShopTab("gems"); onGemsTabConsumed?.(); }
  }, [initialGemsTab]);

  const carouselRef = useRef<HTMLDivElement>(null);

  const packs = getAllPacks();
  const carouselEntries = packs.filter(([, p]) => !p.locked);
  const previewPack = previewCode ? packs.find(([c]) => c === previewCode)?.[1] : null;

  const filteredPacks = packs;

  const handlePull = (code: string, method: "tickets" | "gems", pullCount: 1 | 5) => {
    onOpenPull?.(code, method, pullCount);
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
      </div>

      <PillBar
        tabs={[
          { key: "packs" as const, label: "Packs" },
          { key: "gems" as const, label: "Get Gems" },
        ]}
        activeTab={shopTab}
        onTabChange={setShopTab}
      />
      {shopTab === "packs" && (<>
      {carouselEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
            ✦ Available packs
          </span>
          <div style={{ position: "relative" }}>
            <div
              ref={carouselRef}
              className="shop-carousel"
              style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4 }}
            >
              {carouselEntries.map(([code, pack]) => (
                <CarouselPackCard key={code} code={code} pack={pack} onPreview={setPreviewCode} />
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

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
          All packs
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredPacks.map(([code, pack]) => (
            <PackListRow key={code} code={code} pack={pack} tickets={tickets} gems={gems} onPull={handlePull} onPreview={setPreviewCode} />
          ))}
        </div>
      </div>

      <div style={{
        padding: "16px 20px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "2px solid rgba(255,158,196,0.04)", display: "flex", flexDirection: "column", gap: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
          About
        </span>
        <span style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Each pack contains 5 random football cards. Rarities range from Common to Secret. Reveal each card one by one by swiping.
        </span>
        <span style={{ fontSize: 15, color: "var(--text-disabled)" }}>
          ✦ New packs and limited editions coming soon
        </span>
      </div>

      </>)}
      {shopTab === "gems" && <GemShopSection gems={gems} onPurchaseComplete={onPurchaseComplete} />}
      <div style={{
        textAlign: "center", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase",
        color: "var(--text-disabled)", marginTop: 16,
      }}>
        Ⓒ IDOLBIAS — COLLECT YOUR FAVORITE STARS
      </div>

      {previewPack && previewCode && (
        <PackDetailModal
          code={previewCode}
          pack={previewPack}
          tickets={tickets}
          gems={gems}
          onPull={(method, pullCount) => { handlePull(previewCode, method, pullCount); setPreviewCode(null); }}
          onClose={() => setPreviewCode(null)}
          onGoToGemShop={() => setShopTab("gems")}
        />
      )}
    </div>
  );
}
