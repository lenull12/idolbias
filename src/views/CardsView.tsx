"use client";

import { useEffect, useRef, useState } from "react";
import PillBar from "@/components/PillBar";
import type { CardGrade } from "@/db/schema";
import CardHub from "./CardHub";
import IndexCards from "./indexcards";
import BinderView from "@/components/binder/BinderView";
import BinderAlbumView from "@/components/binder/BinderAlbumView";
import SetCompletionModal from "@/components/binder/SetCompletionModal";
import { getAllPacks, getCardsByPack, getPackInfo } from "@/data/cards";

function wereAllCardsOwned(collection: Record<string, number>, packCode: string): boolean {
  const cards = getCardsByPack(packCode);
  if (cards.length === 0) return false;
  return cards.every((c) => (collection[c.id] ?? 0) > 0);
}

export default function CardsView({
  owned = {},
  ownedGrades = {},
  dust = 0,
  gems = 0,
  onView,
  onGoToShop,
  onClaimed,
  onChanged,
  onBumpMission,
}: {
  owned?: Record<string, number>;
  ownedGrades?: Record<string, Partial<Record<CardGrade, number>>>;
  dust?: number;
  gems?: number;
  onView?: () => void;
  onGoToShop?: (packCode: string) => void;
  onClaimed?: () => void;
  onChanged?: () => void;
  onBumpMission?: (id: string) => void;
}) {
  const [mode, setMode] = useState<"mycards" | "sets" | "catalogue">("mycards");
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [localOverride, setLocalOverride] = useState<Record<string, number> | null>(null);
  const [completionModal, setCompletionModal] = useState<{
    packCode: string; packName: string; edition: string;
    coverImage?: string; totalCards: number;
  } | null>(null);
  const [claimedPacks, setClaimedPacks] = useState<Record<string, boolean>>({});
  const [claiming, setClaiming] = useState(false);

  const effectiveOwned = localOverride ?? owned;

  // Completion detection
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

  // ── Sets tab → BinderAlbumView drill-down ─────────────────────────────
  if (selectedPack) {
    return (
      <BinderAlbumView
        packCode={selectedPack}
        owned={effectiveOwned}
        onBack={() => setSelectedPack(null)}
        onGoToShop={onGoToShop}
        onDevComplete={handleDevComplete}
      />
    );
  }

  return (
    <>
      {completionModal && (
        <SetCompletionModal
          packCode={completionModal.packCode}
          packName={completionModal.packName}
          edition={completionModal.edition}
          coverImage={completionModal.coverImage}
          totalCards={completionModal.totalCards}
          reward={{ dust: 40, gems: 20 }}
          onClaim={() => handleClaimReward(completionModal.packCode, typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.search.includes("dev=1")) ? true : undefined)}
          onDismiss={() => setCompletionModal(null)}
          claiming={claiming}
          claimed={!!claimedPacks[completionModal.packCode]}
        />
      )}

      <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
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
            Browse your collection, complete sets, and explore the full catalogue
          </span>
        </div>

        <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "4px 0 16px" }}>
          <PillBar
            tabs={[
              { key: "mycards" as const, label: "My Cards" },
              { key: "sets" as const, label: "Sets" },
              { key: "catalogue" as const, label: "Catalogue" },
            ]}
            activeTab={mode}
            onTabChange={setMode}
          />
        </div>

        {mode === "mycards" && (
          <CardHub
            owned={owned}
            ownedGrades={ownedGrades}
            dust={dust}
            gems={gems}
            onChanged={() => onChanged?.()}
            onBumpMission={onBumpMission}
          />
        )}

        {mode === "sets" && (
          <BinderView owned={effectiveOwned} onSelectPack={setSelectedPack} onGoToShop={onGoToShop} claimedPacks={claimedPacks} />
        )}

        {mode === "catalogue" && (
          <IndexCards owned={effectiveOwned} onView={onView} onGoToShop={onGoToShop} />
        )}
      </div>
    </>
  );
}
