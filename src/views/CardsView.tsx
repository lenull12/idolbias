"use client";

import { useEffect, useRef, useState } from "react";
import IndexCards from "./indexcards";
import BinderView from "@/components/binder/BinderView";
import BinderAlbumView from "@/components/binder/BinderAlbumView";
import MyCardsView from "@/components/binder/MyCardsView";
import SetCompletionModal from "@/components/binder/SetCompletionModal";
import { getAllPacks, getCardsByPack, getPackInfo } from "@/data/cards";

function wereAllCardsOwned(collection: Record<string, number>, packCode: string): boolean {
  const cards = getCardsByPack(packCode);
  if (cards.length === 0) return false;
  return cards.every((c) => (collection[c.id] ?? 0) > 0);
}

export default function CardsView({ owned, onView, onGoToShop, onClaimed }: {
  owned: Record<string, number>;
  onView?: () => void;
  onGoToShop?: (packCode: string) => void;
  onClaimed?: () => void;
}) {
  const [mode, setMode] = useState<"binder" | "mycards" | "catalogue">("binder");
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [localOverride, setLocalOverride] = useState<Record<string, number> | null>(null);
  const [completionModal, setCompletionModal] = useState<{
    packCode: string; packName: string; edition: string;
    coverImage?: string; totalCards: number;
  } | null>(null);
  const [claimedPacks, setClaimedPacks] = useState<Record<string, boolean>>({});
  const [claiming, setClaiming] = useState(false);

  const effectiveOwned = localOverride ?? owned;

  // Détection de complétion
  const prevOwned = useRef(effectiveOwned);
  useEffect(() => {
    if (Object.keys(prevOwned.current).length === 0) {
      prevOwned.current = effectiveOwned;
      return;
    }
    for (const [code] of getAllPacks().filter(([, p]) => !p.locked)) {
      const wasComplete = wereAllCardsOwned(prevOwned.current, code);
      const isComplete = wereAllCardsOwned(effectiveOwned, code);
      if (!wasComplete && isComplete && !claimedPacks[code]) {
        const info = getPackInfo(code);
        setCompletionModal({
          packCode: code,
          packName: info.name,
          edition: info.edition,
          coverImage: info.coverImage,
          totalCards: getCardsByPack(code).length,
        });
        break;
      }
    }
    prevOwned.current = effectiveOwned;
  }, [effectiveOwned, claimedPacks]);

  const handleClaimReward = async (packCode: string, _dev?: boolean) => {
    setClaiming(true);
    try {
      const res = await fetch("/api/sets/claim-reward", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packCode, _dev }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.success) {
        setClaimedPacks((p) => ({ ...p, [packCode]: true }));
        setCompletionModal(null);
        onClaimed?.();
      }
    } catch (e) {
      console.error("Claim reward failed:", e);
    } finally {
      setClaiming(false);
    }
  };

  const handleDevComplete = (packCode: string, action: "complete" | "reset") => {
    const cards = getCardsByPack(packCode);
    const next = { ...effectiveOwned };
    if (action === "complete") {
      for (const c of cards) if (!next[c.id] || next[c.id] === 0) next[c.id] = 1;
      const info = getPackInfo(packCode);
      setCompletionModal({
        packCode,
        packName: info.name,
        edition: info.edition,
        coverImage: info.coverImage,
        totalCards: cards.length,
      });
    } else {
      for (const c of cards) delete next[c.id];
    }
    setLocalOverride(next);
  };

  return (
    <>
      {/* Completion modal — floats above everything */}
      {completionModal && (
        <SetCompletionModal
          packCode={completionModal.packCode}
          packName={completionModal.packName}
          edition={completionModal.edition}
          coverImage={completionModal.coverImage}
          totalCards={completionModal.totalCards}
          reward={{ dust: 200, gems: 100 }}
          onClaim={() => handleClaimReward(completionModal.packCode, typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.search.includes("dev=1")) ? true : undefined)}
          onDismiss={() => setCompletionModal(null)}
          claiming={claiming}
          claimed={!!claimedPacks[completionModal.packCode]}
        />
      )}

      {selectedPack ? (
        <BinderAlbumView
          packCode={selectedPack}
          owned={effectiveOwned}
          onBack={() => setSelectedPack(null)}
          onGoToShop={onGoToShop}
          onDevComplete={handleDevComplete}
        />
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 16px", marginBottom: 12 }}
            className="mx-auto max-w-[600px] lg:max-w-[1100px]"
          >
            <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
              ✦ Cards
            </span>
            <h1 style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px",
              margin: 0, lineHeight: 1.1,
              background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              your collection
            </h1>
            <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
              Browse, organize, and complete your photocard sets
            </span>
          </div>

          {/* Mode toggle */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            padding: "12px 16px 8px",
            display: "flex", gap: 2,
          }}
            className="mx-auto max-w-[600px] lg:max-w-[1100px]"
          >
            <div style={{
              display: "flex", gap: 2, padding: 2, borderRadius: 8,
              background: "rgba(var(--text-primary-rgb),0.04)",
            }}>
              <button onClick={() => setMode("binder")} style={{
                padding: "4px 14px", borderRadius: 6, border: "none",
                background: mode === "binder" ? "var(--surface-white)" : "transparent",
                color: mode === "binder" ? "var(--accent-hotpink)" : "var(--text-muted)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
                boxShadow: mode === "binder" ? "1px 1px 0px rgba(var(--text-primary-rgb),0.1)" : "none",
              }}>
                📁 Binder
              </button>
              <button onClick={() => setMode("mycards")} style={{
                padding: "4px 14px", borderRadius: 6, border: "none",
                background: mode === "mycards" ? "var(--surface-white)" : "transparent",
                color: mode === "mycards" ? "var(--accent-hotpink)" : "var(--text-muted)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
                boxShadow: mode === "mycards" ? "1px 1px 0px rgba(var(--text-primary-rgb),0.1)" : "none",
              }}>
                ❤️ My Cards
              </button>
              <button onClick={() => setMode("catalogue")} style={{
                padding: "4px 14px", borderRadius: 6, border: "none",
                background: mode === "catalogue" ? "var(--surface-white)" : "transparent",
                color: mode === "catalogue" ? "var(--accent-hotpink)" : "var(--text-muted)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
                boxShadow: mode === "catalogue" ? "1px 1px 0px rgba(var(--text-primary-rgb),0.1)" : "none",
              }}>
                🖼 Catalogue
              </button>
            </div>
          </div>

          {mode === "binder" ? (
            <BinderView owned={effectiveOwned} onSelectPack={setSelectedPack} onGoToShop={onGoToShop} claimedPacks={claimedPacks} />
          ) : mode === "mycards" ? (
            <MyCardsView owned={effectiveOwned} />
          ) : (
            <IndexCards owned={effectiveOwned} onView={onView} onGoToShop={onGoToShop} />
          )}
        </>
      )}
    </>
  );
}
