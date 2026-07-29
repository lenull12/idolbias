"use client";

import { useState, useMemo } from "react";
import SquadEditor, { type SquadCharacter, type SquadSlot } from "@/components/SquadEditor";
import { getCharacters } from "@/data/footballCards";
import { CHARACTER_STATS } from "@/data/characterStats";
import { FORMATIONS, type FormationCode } from "@/db/lineupSchema";
import { getSlotPosition12, getPositionFit } from "@/lib/positionMatch";

export default function SquadView() {
  const allCharacters = useMemo(() => {
    const chars = getCharacters();
    return chars
      .filter((c) => {
        const cs = CHARACTER_STATS[c.id];
        return cs && !cs.isGK;
      })
      .map((c) => {
        const cs = CHARACTER_STATS[c.id];
        return {
          id: c.id,
          name: c.name,
          position: cs.position,
          posSec1: cs.posSec1,
          posSec2: cs.posSec2,
          ovr: cs.base,
          rarity: "rare" as const,
          assigned: false,
        } as SquadCharacter;
      });
  }, []);

  const [formation, setFormation] = useState<FormationCode>("4-3-3");

  const initialSlots = useMemo(() => {
    return FORMATIONS[formation].map((fs) => {
      const pos12 = getSlotPosition12(fs.slotId, formation);
      return { slotId: fs.slotId, position12: pos12, characterId: null, fit: "off" as const };
    });
  }, [formation]);

  const [squad, setSquad] = useState<SquadSlot[]>(initialSlots);

  const handleSquadChange = (newSquad: SquadSlot[]) => {
    setSquad(newSquad);
  };

  const handleAutoFill = () => {
    const unassigned = [...allCharacters];
    const newSquad = FORMATIONS[formation].map((fs) => {
      const pos12 = getSlotPosition12(fs.slotId, formation);
      let bestIdx = -1;
      let bestFit = 0;
      for (let i = 0; i < unassigned.length; i++) {
        const char = unassigned[i];
        const fit = getPositionFit(char, pos12);
        const score = fit === "perfect" ? 4 : fit === "close" ? 3 : fit === "secondary" ? 2 : 1;
        if (score > bestFit) {
          bestFit = score;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        const char = unassigned[bestIdx];
        unassigned.splice(bestIdx, 1);
        return { slotId: fs.slotId, position12: pos12, characterId: char.id, fit: getPositionFit(char, pos12) };
      }
      return { slotId: fs.slotId, position12: pos12, characterId: null, fit: "off" as const };
    });
    setSquad(newSquad);
  };

  return (
    <div className="mx-auto max-w-[900px]" style={{ padding: "24px 16px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Match Lab
        </span>
        <button
          onClick={handleAutoFill}
          style={{
            marginLeft: "auto", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(var(--text-primary-rgb),0.12)",
            background: "var(--surface)", color: "var(--text-primary)", cursor: "pointer", fontSize: 12, fontWeight: 600,
            fontFamily: "inherit", transition: "background 0.15s",
          }}
        >
          Auto-fill ⚡
        </button>
      </div>

      <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 28, fontWeight: 400, margin: "0 0 24px", letterSpacing: "-0.3px" }}>
        Composition d&apos;équipe
      </h1>

      <SquadEditor
        characters={allCharacters}
        squad={squad}
        onChange={handleSquadChange}
        label="Terrain"
      />

      <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "var(--surface)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-primary)" }}>💡 Comment ça marche</strong><br />
        Clique sur une joueuse dans la liste, puis sur un emplacement pour l&apos;assigner.
        Tu peux aussi glisser-déposer. Les pastilles colorées indiquent l&apos;adéquation au poste.
        Passe la souris sur un emplacement occupé pour voir l&apos;impact du malus sur les stats clés.
      </div>
    </div>
  );
}
