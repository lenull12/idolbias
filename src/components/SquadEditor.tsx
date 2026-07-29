"use client";

import { useState } from "react";
import type { Rarity, Position12 } from "@/db/footballSchema";
import type { FormationCode } from "@/db/lineupSchema";
import { FORMATIONS } from "@/db/lineupSchema";
import { FitLevel, getPositionFit, getFitColor, getFitLabel, getSlotPosition12, applyPositionPenalty, getPositionWeights } from "@/lib/positionMatch";
import type { StatKey } from "@/data/characterStats";

export interface SquadCharacter {
  id: string;
  name: string;
  position: string;
  posSec1?: string;
  posSec2?: string;
  ovr: number;
  rarity: Rarity;
  assigned: boolean;
}

export interface SquadSlot {
  slotId: string;
  position12: Position12;
  characterId: string | null;
  fit: FitLevel;
}

interface SquadEditorProps {
  characters: SquadCharacter[];
  squad: SquadSlot[];
  onChange: (squad: SquadSlot[]) => void;
  onRarityChange?: (charId: string, rarity: Rarity) => void;
  onFormationChange?: (formation: FormationCode) => void;
  label?: string;
}

const FORMATION_OPTIONS: { code: FormationCode; label: string }[] = [
  { code: "4-3-3", label: "4-3-3" },
  { code: "4-4-2", label: "4-4-2" },
  { code: "4-2-3-1", label: "4-2-3-1" },
];

const PITCH_W = 320;
const PITCH_H = 480;

function getStatLabel(stat: string): string {
  const labels: Record<string, string> = {
    vitesse: "Vitesse", acceleration: "Accél.", endurance: "Endurance",
    puissance: "Puissance", agilite: "Agilité", detente: "Détente", force: "Force",
    anticipation: "Anticipation", sangFroid: "Sang-froid", leadership: "Leadership",
    positionnement: "Positionnement", agressivite: "Agressivité", decision: "Décision",
    workRate: "Work rate", flair: "Flair",
    passe: "Passe", tir: "Tir", dribble: "Dribble", centre: "Centre",
    tacle: "Tacle", controle: "Contrôle", jeu_de_tete: "Jeu de tête", technique: "Technique",
    reflexes: "Réflexes", handling: "Handling", aerialReach: "Portée aérienne",
    commandArea: "Surface", kicking: "Dégagement", rushingOut: "Sortie",
    cf: "Coup franc", corners: "Corner", penalty: "Penalty", longThrows: "Touche",
  };
  return labels[stat] ?? stat;
}

export default function SquadEditor({ characters, squad, onChange, onRarityChange, onFormationChange, label }: SquadEditorProps) {
  const [formation, setFormation] = useState<FormationCode>("4-3-3");
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const formationSlots = FORMATIONS[formation];

  const unassigned = characters.filter((c) => !squad.find((s) => s.characterId === c.id));

  const getCharacter = (id: string) => characters.find((c) => c.id === id);

  const getSlot = (slotId: string) => squad.find((s) => s.slotId === slotId);

  const assignCharacter = (slotId: string, characterId: string) => {
    const slotPos12 = getSlotPosition12(slotId, formation);
    const char = getCharacter(characterId);
    if (!char) return;
    const fit = getPositionFit(char, slotPos12);
    onChange(squad.map((s) => s.slotId === slotId ? { ...s, characterId, fit, position12: slotPos12 } : s));
  };

  const unassignSlot = (slotId: string) => {
    const slotPos12 = getSlotPosition12(slotId, formation);
    onChange(squad.map((s) => s.slotId === slotId ? { ...s, characterId: null, fit: "off" as FitLevel, position12: slotPos12 } : s));
  };

  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const handleCharSelect = (id: string) => {
    if (selectedChar === id) {
      setSelectedChar(null);
      return;
    }
    setSelectedChar(id);
  };

  const handleSlotClick = (slotId: string) => {
    const slot = getSlot(slotId);
    if (slot?.characterId) {
      unassignSlot(slotId);
      return;
    }
    if (selectedChar) {
      assignCharacter(slotId, selectedChar);
      setSelectedChar(null);
    }
  };

  const handleFormationChange = (f: FormationCode) => {
    setFormation(f);
    onFormationChange?.(f);
    const newSlots = FORMATIONS[f].map((fs) => {
      const existing = squad.find((s) => s.slotId === fs.slotId);
      const pos12 = getSlotPosition12(fs.slotId, f);
      if (existing) {
        const char = getCharacter(existing.characterId ?? "");
        const fit = existing.characterId && char ? getPositionFit(char, pos12) : "off" as FitLevel;
        return { ...existing, position12: pos12, fit };
      }
      return { slotId: fs.slotId, position12: pos12, characterId: null, fit: "off" as FitLevel };
    });
    onChange(newSlots);
  };

  const handleDragStart = (e: React.DragEvent, characterId: string) => {
    e.dataTransfer.setData("text/plain", characterId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const characterId = e.dataTransfer.getData("text/plain");
    if (characterId) assignCharacter(slotId, characterId);
  };

  const handleSlotEnter = (e: React.MouseEvent, slotId: string) => {
    setHoveredSlot(slotId);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleSlotLeave = () => {
    setHoveredSlot(null);
  };

  const STAT_PREVIEW_COUNT = 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {label && (
        <span style={{ fontSize: 13, color: "var(--text-disabled)", letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ {label}
        </span>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {FORMATION_OPTIONS.map((f) => (
          <button
            key={f.code}
            onClick={() => handleFormationChange(f.code)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "1px solid",
              borderColor: formation === f.code ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.15)",
              background: formation === f.code ? "var(--accent-hotpink)" : "var(--surface)",
              color: formation === f.code ? "#fff" : "var(--text-primary)",
              cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div
          style={{
            position: "relative", width: PITCH_W, height: PITCH_H, flexShrink: 0,
            background: "linear-gradient(180deg, #1a3d1a 0%, #2d5a2d 40%, #1a3d1a 100%)",
            borderRadius: 12, border: "2px solid rgba(255,255,255,0.08)", overflow: "hidden",
          }}
        >
          <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12, pointerEvents: "none" }}>
            <rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="white" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="white" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="0.4" />
            <rect x="30" y="2" width="40" height="18" rx="9" fill="none" stroke="white" strokeWidth="0.4" />
            <rect x="30" y="80" width="40" height="18" rx="9" fill="none" stroke="white" strokeWidth="0.4" />
          </svg>

          {formationSlots.map((fs) => {
            const slot = getSlot(fs.slotId);
            const assignedChar = slot?.characterId ? getCharacter(slot.characterId) : null;
            const fit = slot?.fit ?? "off";
            const fitColor = getFitColor(fit);
            const isHovered = hoveredSlot === fs.slotId;
            const pos12 = getSlotPosition12(fs.slotId, formation);

            const leftPct = fs.x;
            const topPct = 100 - fs.y;

            return (
              <div
                key={fs.slotId}
                onClick={() => handleSlotClick(fs.slotId)}
                onMouseEnter={(ev) => handleSlotEnter(ev, fs.slotId)}
                onMouseMove={(ev) => setTooltipPos({ x: ev.clientX, y: ev.clientY })}
                onMouseLeave={handleSlotLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, fs.slotId)}
                style={{
                  position: "absolute",
                  left: `${leftPct}%`, top: `${topPct}%`,
                  transform: "translate(-50%, -50%)",
                  width: 80, height: 68,
                  borderRadius: 8,
                  border: "2px solid",
                  borderColor: assignedChar ? fitColor : "rgba(255,255,255,0.1)",
                  background: assignedChar
                    ? `${fitColor}18`
                    : "rgba(255,255,255,0.04)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 2,
                  cursor: assignedChar ? "pointer" : "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  zIndex: isHovered ? 10 : 1,
                }}
              >
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                  {pos12}
                </span>
                {assignedChar ? (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>
                      {assignedChar.name.split(" ").pop()}
                    </span>
                    <span style={{
                      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                      background: fitColor, marginTop: 2,
                    }} />
                  </>
                ) : selectedChar ? (
                  <span style={{ fontSize: 10, color: "var(--accent-hotpink)" }}>▼ placer</span>
                ) : (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>vide</span>
                )}
              </div>
            );
          })}

          {hoveredSlot && (() => {
            const slot = getSlot(hoveredSlot);
            const assignedChar = slot?.characterId ? getCharacter(slot.characterId) : null;
            if (!assignedChar || slot?.fit === "perfect") return null;

            const pos12 = getSlotPosition12(hoveredSlot, formation);
            const weights = getPositionWeights(pos12);
            const topStats = Object.entries(weights)
              .sort(([, a], [, b]) => b - a)
              .slice(0, STAT_PREVIEW_COUNT);

            const pct = slot?.fit === "close" ? 5 : slot?.fit === "secondary" ? 10 : 25;

            return (
              <div
                style={{
                  position: "fixed",
                  left: Math.min(tooltipPos.x + 12, window.innerWidth - 220),
                  top: Math.min(tooltipPos.y - 10, window.innerHeight - 200),
                  background: "var(--surface)",
                  border: "1px solid rgba(var(--text-primary-rgb),0.12)",
                  borderRadius: 10, padding: "10px 14px",
                  zIndex: 999, fontSize: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  minWidth: 180,
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  {assignedChar.name} → {pos12}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  {getFitLabel(slot?.fit ?? "off")} · −{pct}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                  Stats les plus impactées :
                </div>
                {topStats.map(([statKey, weight]) => (
                  <div key={statKey} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "1px 0" }}>
                    <span>{getStatLabel(statKey)}</span>
                    <span style={{ color: "var(--text-muted)" }}>−{Math.round(pct * weight)}%</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
                  Stats réelles selon la carte
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
            Disponibles ({unassigned.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 440, overflowY: "auto" }}>
            {unassigned.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-disabled)", padding: 16, textAlign: "center" }}>
                11 joueuses placées
              </div>
            ) : (
              unassigned.map((char) => (
                <div
                  key={char.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, char.id)}
                  onClick={() => handleCharSelect(char.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 8,
                    background: selectedChar === char.id ? "rgba(var(--accent-hotpink-rgb),0.12)" : "var(--surface)",
                    border: "1px solid",
                    borderColor: selectedChar === char.id ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.06)",
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: char.rarity === "secret" ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                      : char.rarity === "legendary" ? "#f59e0b"
                      : char.rarity === "epic" ? "#a855f7"
                      : char.rarity === "rare" ? "#3b82f6"
                      : "#6b7280",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {char.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {char.position}{char.posSec1 ? ` · ${char.posSec1}` : ""}{char.posSec2 ? `, ${char.posSec2}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                    {char.ovr}
                  </div>
                  {onRarityChange && (
                    <select
                      value={char.rarity}
                      onChange={(e) => onRarityChange(char.id, e.target.value as Rarity)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 10, padding: "1px 2px", width: 58,
                        border: "1px solid rgba(var(--text-primary-rgb),0.12)",
                        borderRadius: 4, background: "var(--bg)", color: "var(--text-primary)",
                        fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      {(["common","rare","epic","legendary","secret"] as Rarity[]).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#22c55e", marginRight: 4, verticalAlign: "middle" }} /> Poste natif</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#84cc16", marginRight: 4, verticalAlign: "middle" }} /> Même groupe</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#eab308", marginRight: 4, verticalAlign: "middle" }} /> Poste secondaire</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#ef4444", marginRight: 4, verticalAlign: "middle" }} /> Hors poste</span>
      </div>
    </div>
  );
}
