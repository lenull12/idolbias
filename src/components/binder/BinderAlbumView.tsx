"use client";

import { useMemo } from "react";
import CardSlot from "./CardSlot";
import type { CharacterDef, PackInfo } from "@/data/footballCards";
import { getPrintsByCharacter } from "@/data/footballCards";
import type { Rarity } from "@/db/footballSchema";

const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary", "secret"];

function makeDummyCardProps(char: CharacterDef, rarity: Rarity) {
  const ovrMin: Record<Rarity, number> = { common: 45, rare: 65, epic: 75, legendary: 85, secret: 95 };
  return {
    imageSrc: char.photoVariants.standard,
    ovr: ovrMin[rarity] + Math.floor(Math.random() * 10),
    position: char.defaultPosition,
    nation: nationToCode(char.nation),
    stats: { tec: 60, phy: 55, men: 65 },
    rarity,
    name: char.name.toUpperCase(),
    refCode: `${nationToCode(char.nation)}-${char.id.split("-")[1]?.toUpperCase() ?? "000"}-${rarity[0].toUpperCase()}`,
    nationLabel: char.nation.charAt(0).toUpperCase() + char.nation.slice(1),
    positionLabel: char.defaultPosition,
  };
}

function nationToCode(nation: string): string {
  const map: Record<string, string> = {
    france: "FR", allemagne: "DE", angleterre: "GB", italie: "IT",
    espagne: "ES", bresil: "BR", japon: "JP", argentine: "AR",
  };
  return map[nation] ?? "XX";
}

export default function BinderAlbumView({
  pack,
  characters,
  owned,
  onBack,
  onView,
}: {
  pack: PackInfo;
  characters: CharacterDef[];
  owned?: Record<string, number>;
  onBack: () => void;
  onView?: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "var(--accent-purple)",
        cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "0 0 12px",
      }}>
        ← Back to sets
      </button>

      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
        {pack.name}
      </h2>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px" }}>
        {pack.edition} · {characters.length} characters
      </p>

      {characters.map((char) => {
        const prints = getPrintsByCharacter(char.id);
        const ownedCount = prints.filter((p) => owned?.[p.refCode] && owned[p.refCode] > 0).length;

        return (
          <div key={char.id} style={{
            marginBottom: 20, padding: 14, borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{char.name}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {ownedCount}/{prints.length} owned
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {RARITY_ORDER.map((rarity) => {
                const isOwned = prints.some((p) => p.rarity === rarity && owned?.[p.refCode] && owned[p.refCode] > 0);
                const cardProps = makeDummyCardProps(char, rarity);
                return (
                  <div key={rarity} style={{ opacity: isOwned ? 1 : 0.35 }}>
                    <CardSlot card={cardProps} zoomed={false} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
