"use client";

import { CHARACTER_STATS } from "@/data/characterStats";
import { FRAC } from "@/lib/statGenerator";
import type { OwnedCard } from "@/types/ownedCard";

const PHY_LABELS: Record<string, string> = {
  vitesse: "SPD",
  acceleration: "ACC",
  endurance: "END",
  puissance: "PWR",
  agilite: "AGI",
  detente: "JMP",
};

const MEN_LABELS: Record<string, string> = {
  anticipation: "ANT",
  sangFroid: "CMF",
  leadership: "LDR",
  positionnement: "POS",
  agressivite: "AGG",
  decision: "DEC",
};

const TEC_LABELS: Record<string, string> = {
  passe: "PAS",
  tir: "SHO",
  dribble: "DRI",
  centre: "CRO",
  tacle: "TAC",
  controle: "CON",
};

const GK_TEC_MAP: Record<string, string> = {
  passe: "REF",
  tir: "HAN",
  dribble: "ARE",
  centre: "CMD",
  tacle: "KIC",
  controle: "RUS",
};

const SET_LABELS: Record<string, string> = {
  cf: "CF",
  corners: "COR",
  penalty: "PEN",
  longThrows: "LTH",
};

function statColor(val: number): string {
  if (val >= 90) return "var(--accent-hotpink)";
  if (val >= 85) return "var(--accent-pink)";
  if (val >= 80) return "var(--accent-purple)";
  return "var(--text-muted)";
}

function StatBar({ label, value }: { label: string; value: number }) {
  const color = statColor(value);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>
          {value}
        </span>
      </div>
      <div style={{
        height: 4, borderRadius: 2, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(value / 99 * 100, 100)}%`, height: "100%", borderRadius: 2,
          background: color, transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

export default function PlayerStatsView({ card }: { card: OwnedCard }) {
  const cs = CHARACTER_STATS[card.characterId];
  const isGK = card.position === "GB";
  const frac = FRAC[card.rarity as keyof typeof FRAC] ?? 1;
  const scale = (v: number) => Math.max(1, Math.min(99, Math.round((v ?? 0) * frac)));

  const tecKeys = isGK
    ? (Object.keys(TEC_LABELS) as string[]).map((k) => ({ key: k, label: GK_TEC_MAP[k] }))
    : (Object.keys(TEC_LABELS) as string[]).map((k) => ({ key: k, label: TEC_LABELS[k] }));

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 20,
      padding: 20, background: "var(--surface)", borderRadius: 16,
      border: "2px solid rgba(var(--text-primary-rgb),0.08)",
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 16,
        flexDirection: "row",
      }}>
        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <BlockTitle label="PHYSICAL" />
          {Object.keys(PHY_LABELS).map((k) => (
            <StatBar key={k} label={PHY_LABELS[k]} value={scale(card.phyStats[k] ?? 0)} />
          ))}
        </div>

        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <BlockTitle label="MENTAL" />
          {Object.keys(MEN_LABELS).map((k) => (
            <StatBar key={k} label={MEN_LABELS[k]} value={scale(card.menStats[k] ?? 0)} />
          ))}
        </div>

        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <BlockTitle label={isGK ? "GOALKEEPER" : "TECHNICAL"} />
          {tecKeys.map(({ key, label }) => (
            <StatBar key={key} label={label} value={scale(card.tecStats[key] ?? 0)} />
          ))}
        </div>

        <div style={{ flex: "0 0 120px", minWidth: 100 }}>
          <BlockTitle label="SET" />
          {Object.keys(SET_LABELS).map((k) => (
            <StatBar key={k} label={SET_LABELS[k]} value={scale(cs?.stats?.[k as keyof typeof cs.stats] ?? 0)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockTitle({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)",
      textTransform: "uppercase", marginBottom: 12, paddingBottom: 6,
      borderBottom: "1px solid rgba(var(--text-primary-rgb),0.06)",
    }}>
      {label}
    </div>
  );
}
