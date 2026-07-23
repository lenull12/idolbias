"use client";

import { useState } from "react";
import PillBar from "@/components/PillBar";
import type { CardGrade } from "@/db/schema";
import type { OwnedCard } from "@/types/ownedCard";
import CardHub from "./CardHub";
import BinderView from "@/components/binder/BinderView";
import IndexCards from "./indexcards";

export default function CardsView({
  owned = {},
  ownedCards = [],
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
  ownedCards?: OwnedCard[];
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

  return (
    <>
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
            ownedCards={ownedCards}
            onChanged={() => onChanged?.()}
            onBumpMission={onBumpMission}
          />
        )}

        {mode === "sets" && (
          <BinderView owned={owned} onView={onView} onGoToShop={onGoToShop} />
        )}

        {mode === "catalogue" && (
          <IndexCards owned={owned} onView={onView} onGoToShop={onGoToShop} />
        )}
      </div>
    </>
  );
}
