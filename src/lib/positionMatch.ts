import { type StatKey } from "@/data/characterStats";
import type { Position12 } from "@/db/footballSchema";
import type { FormationCode } from "@/db/lineupSchema";

export type FitLevel = "perfect" | "close" | "secondary" | "off";

export function toGroup(pos12: string): "GB" | "DEF" | "MIL" | "ATT" {
  if (pos12 === "GK") return "GB";
  if (["RB", "LB", "CB"].includes(pos12)) return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(pos12)) return "MIL";
  return "ATT";
}

export function getPositionFit(
  character: { position: string; posSec1?: string; posSec2?: string },
  slotPosition12: string,
): FitLevel {
  if (slotPosition12 === character.position) return "perfect";
  if (slotPosition12 === character.posSec1 || slotPosition12 === character.posSec2) return "secondary";
  if (toGroup(slotPosition12) === toGroup(character.position)) return "close";
  return "off";
}

export const SLOT_POSITION12: Record<FormationCode, Record<string, Position12>> = {
  "4-3-3": {
    gb: "GK",
    "def-l": "LB",
    "def-cl": "CB",
    "def-cr": "CB",
    "def-r": "RB",
    "mil-l": "LM",
    "mil-c": "CM",
    "mil-r": "RM",
    "att-l": "LW",
    "att-c": "ST",
    "att-r": "RW",
  },
  "4-4-2": {
    gb: "GK",
    "def-l": "LB",
    "def-cl": "CB",
    "def-cr": "CB",
    "def-r": "RB",
    "mil-l": "LM",
    "mil-cl": "CM",
    "mil-cr": "CM",
    "mil-r": "RM",
    "att-l": "ST",
    "att-r": "ST",
  },
  "4-2-3-1": {
    gb: "GK",
    "def-l": "LB",
    "def-cl": "CB",
    "def-cr": "CB",
    "def-r": "RB",
    "mil-d1": "CDM",
    "mil-d2": "CDM",
    "mil-l": "LW",
    "mil-c": "CAM",
    "mil-r": "RW",
    "att-c": "ST",
  },
};

export function getSlotPosition12(slotId: string, formation: FormationCode): Position12 {
  return SLOT_POSITION12[formation]?.[slotId] ?? "ST";
}

export function getPositionWeights(pos12: string): Partial<Record<StatKey, number>> {
  switch (pos12) {
    case "GK":
      return { reflexes: 1.0, handling: 1.0, aerialReach: 0.8, commandArea: 0.8, rushingOut: 0.7, kicking: 0.5, anticipation: 0.6, positionnement: 0.6, decision: 0.5, agilite: 0.4, detente: 0.4 };
    case "CB":
      return { tacle: 1.0, anticipation: 1.0, positionnement: 1.0, force: 0.8, puissance: 0.7, detente: 0.7, vitesse: 0.5, agressivite: 0.6, decision: 0.7, passe: 0.4, jeu_de_tete: 0.9, agilite: 0.3 };
    case "LB":
    case "RB":
      return { tacle: 1.0, vitesse: 0.9, acceleration: 0.8, endurance: 0.7, centre: 0.9, dribble: 0.5, passe: 0.5, positionnement: 0.7, decision: 0.6, anticipation: 0.6, agilite: 0.4 };
    case "CDM":
      return { tacle: 0.9, anticipation: 0.9, positionnement: 0.9, agressivite: 0.7, endurance: 0.7, decision: 0.8, passe: 0.7, force: 0.6, puissance: 0.5, controle: 0.5 };
    case "CM":
      return { passe: 1.0, controle: 0.9, decision: 0.8, anticipation: 0.7, endurance: 0.7, dribble: 0.6, technique: 0.6, agressivite: 0.4, positionnement: 0.6, tir: 0.4, workRate: 0.5 };
    case "CAM":
      return { passe: 1.0, dribble: 0.9, technique: 0.8, tir: 0.7, decision: 0.8, controle: 0.7, sangFroid: 0.7, anticipation: 0.6, flair: 0.6, agilite: 0.5 };
    case "LM":
    case "RM":
      return { centre: 1.0, dribble: 0.8, vitesse: 0.8, acceleration: 0.7, passe: 0.7, controle: 0.6, endurance: 0.7, technique: 0.5, decision: 0.5, agilite: 0.4 };
    case "LW":
    case "RW":
      return { dribble: 1.0, vitesse: 0.9, acceleration: 0.8, tir: 0.7, centre: 0.7, technique: 0.6, passe: 0.5, sangFroid: 0.6, decision: 0.5, agilite: 0.5, flair: 0.5 };
    case "ST":
      return { tir: 1.0, sangFroid: 1.0, dribble: 0.9, vitesse: 0.8, acceleration: 0.7, detente: 0.8, decision: 0.7, controle: 0.6, passe: 0.3, jeu_de_tete: 0.5, agilite: 0.4 };
    default:
      return {};
  }
}

export const PENALTY: Record<FitLevel, number> = {
  perfect: 0.00,
  close: 0.05,
  secondary: 0.10,
  off: 0.25,
};

export function applyPositionPenalty(
  stats: Partial<Record<StatKey, number>>,
  slotPosition12: string,
  character: { position: string; posSec1?: string; posSec2?: string },
): Partial<Record<StatKey, number>> {
  const fit = getPositionFit(character, slotPosition12);
  if (fit === "perfect") return stats;

  const penalty = PENALTY[fit];
  const weights = getPositionWeights(slotPosition12);

  const result: Record<string, number> = { ...stats };
  for (const [statKey, weight] of Object.entries(weights)) {
    if (weight > 0 && result[statKey] !== undefined) {
      const reduction = penalty * weight;
      result[statKey] = Math.round(result[statKey] * (1 - reduction));
    }
  }
  return result as Partial<Record<StatKey, number>>;
}

export function getFitColor(fit: FitLevel): string {
  return fit === "perfect" ? "#22c55e"
    : fit === "close" ? "#84cc16"
    : fit === "secondary" ? "#eab308"
    : "#ef4444";
}

export function getFitLabel(fit: FitLevel): string {
  return fit === "perfect" ? "Poste natif"
    : fit === "close" ? "Même groupe"
    : fit === "secondary" ? "Poste secondaire"
    : "Hors poste";
}
