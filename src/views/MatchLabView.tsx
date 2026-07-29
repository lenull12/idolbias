"use client";

import { useState, useMemo, useCallback } from "react";
import { MatchPitch2D, eventLabel } from "@/components/MatchPitch2D";
import { simulateMatch, type MatchResult, type TacticSlider } from "@/lib/matchEngine";
import { runSpatialSimulation, spatialToMatchResult } from "@/lib/spatialEngine";
import { buildTeamInput, runBatch, type BatchResult } from "@/lib/matchLabTeamBuilder";
import { getCharacters } from "@/data/footballCards";
import { CHARACTER_STATS } from "@/data/characterStats";
import type { Rarity } from "@/db/footballSchema";
import type { FormationCode } from "@/db/lineupSchema";
import { FORMATIONS } from "@/db/lineupSchema";
import { getSlotPosition12 } from "@/lib/positionMatch";
import SquadEditor, { type SquadCharacter, type SquadSlot } from "@/components/SquadEditor";

const LAB_NATIONS = ["japon", "allemagne", "argentine"] as const;

interface TeamState {
  nation: string;
  formation: FormationCode;
  rarities: Record<string, Rarity>;
  tactics: { mentality: TacticSlider; defensiveLine: TacticSlider; tempo: TacticSlider; passingDirectness: TacticSlider };
  squad: SquadSlot[];
}

function makeInitialSquad(formation: FormationCode): SquadSlot[] {
  return FORMATIONS[formation].map((fs) => ({
    slotId: fs.slotId,
    position12: getSlotPosition12(fs.slotId, formation),
    characterId: null,
    fit: "off" as const,
  }));
}

function buildSquadCharacters(nation: string, rarities: Record<string, Rarity>): SquadCharacter[] {
  return getCharacters()
    .filter((c) => c.nation === nation)
    .map((c) => {
      const cs = CHARACTER_STATS[c.id];
      return {
        id: c.id,
        name: c.name,
        position: cs.position,
        posSec1: cs.posSec1,
        posSec2: cs.posSec2,
        ovr: cs.base,
        rarity: rarities[c.id] ?? "common",
        assigned: false,
      };
    });
}

export default function MatchLabView() {
  const [seed, setSeed] = useState(() => "lab-" + Date.now());
  const [batchCount, setBatchCount] = useState(50);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [engineMode, setEngineMode] = useState<"zones" | "spatial">("zones");

  const [home, setHome] = useState<TeamState>(() => ({
    nation: "japon",
    formation: "4-3-3",
    rarities: {},
    tactics: { mentality: 0, defensiveLine: 0, tempo: 0, passingDirectness: 0 },
    squad: makeInitialSquad("4-3-3"),
  }));
  const [away, setAway] = useState<TeamState>(() => ({
    nation: "argentine",
    formation: "4-3-3",
    rarities: {},
    tactics: { mentality: 0, defensiveLine: 0, tempo: 0, passingDirectness: 0 },
    squad: makeInitialSquad("4-3-3"),
  }));

  const homeChars = useMemo(() => buildSquadCharacters(home.nation, home.rarities), [home.nation, home.rarities]);
  const awayChars = useMemo(() => buildSquadCharacters(away.nation, away.rarities), [away.nation, away.rarities]);

  const handleNationChange = (side: "home" | "away", nation: string) => {
    const setter = side === "home" ? setHome : setAway;
    setter((prev) => ({
      ...prev, nation, formation: "4-3-3" as FormationCode,
      rarities: {},
      squad: makeInitialSquad("4-3-3"),
    }));
  };

  const handleFormationChange = (side: "home" | "away", formation: FormationCode) => {
    const setter = side === "home" ? setHome : setAway;
    setter((prev) => ({ ...prev, formation }));
  };

  const handleRarityChange = (side: "home" | "away", charId: string, rarity: Rarity) => {
    const setter = side === "home" ? setHome : setAway;
    setter((prev) => ({ ...prev, rarities: { ...prev.rarities, [charId]: rarity } }));
  };

  const handleSquadChange = (side: "home" | "away", squad: SquadSlot[]) => {
    const setter = side === "home" ? setHome : setAway;
    setter((prev) => ({ ...prev, squad }));
  };

  const handleTactic = (side: "home" | "away", key: keyof TeamState["tactics"], val: number) => {
    const clamped = Math.max(-2, Math.min(2, val)) as TacticSlider;
    const setter = side === "home" ? setHome : setAway;
    setter((prev) => ({ ...prev, tactics: { ...prev.tactics, [key]: clamped } }));
  };

  const getSquadParams = useCallback((state: TeamState) => {
    const charIdSet = new Set(getCharacters().filter(c => c.nation === state.nation).map(c => c.id));
    const assignments: Record<string, string> = {};
    for (const slot of state.squad) {
      if (slot.characterId && charIdSet.has(slot.characterId)) {
        assignments[slot.slotId] = slot.characterId;
      }
    }
    return { ratings: state.rarities, tactics: state.tactics, assignments, formation: state.formation };
  }, []);

  const handleLaunch = () => {
    const homeP = getSquadParams(home);
    const awayP = getSquadParams(away);

    const homeInput = buildTeamInput(home.nation, homeP.ratings, homeP.tactics, seed, homeP.formation, homeP.assignments);
    const awayInput = buildTeamInput(away.nation, awayP.ratings, awayP.tactics, seed, awayP.formation, awayP.assignments);

    if (engineMode === "spatial") {
      const ticks = runSpatialSimulation(homeInput, awayInput, seed);
      const result = spatialToMatchResult(ticks, home.nation, away.nation);
      setMatchResult(result);
    } else {
      const result = simulateMatch(homeInput, awayInput, seed);
      setMatchResult(result);
    }
    setBatchResult(null);
  };

  const handleBatch = async () => {
    setBatchRunning(true);
    setBatchResult(null);
    setMatchResult(null);

    const homeP = getSquadParams(home);
    const awayP = getSquadParams(away);

    await new Promise((r) => setTimeout(r, 50));

    const result = runBatch(
      { nation: home.nation, ratings: homeP.ratings, tactics: homeP.tactics, formation: homeP.formation, assignments: homeP.assignments },
      { nation: away.nation, ratings: awayP.ratings, tactics: awayP.tactics, formation: awayP.formation, assignments: awayP.assignments },
      batchCount, seed,
    );
    setBatchResult(result);
    setBatchRunning(false);
  };

  const TacticSliders = ({ side, state }: { side: "home" | "away"; state: TeamState }) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {(["mentality", "defensiveLine", "tempo", "passingDirectness"] as const).map((key) => (
        <div key={key} style={{ flex: 1, minWidth: 80 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>
            <span>{key === "mentality" ? "Mentalité" : key === "defensiveLine" ? "Ligne déf." : key === "tempo" ? "Tempo" : "Direct."}</span>
            <span>{state.tactics[key] > 0 ? "+" : ""}{state.tactics[key]}</span>
          </div>
          <input
            type="range" min={-2} max={2} step={1}
            value={state.tactics[key]}
            onChange={(e) => handleTactic(side, key, Number(e.target.value))}
            style={{ width: "100%", height: 4, accentColor: "var(--accent-hotpink)", cursor: "pointer" }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px]" style={{ padding: "24px 16px 48px" }}>
      <span style={{ fontSize: 13, color: "var(--text-disabled)", letterSpacing: "4px", textTransform: "uppercase" }}>
        ✦ Match Lab
      </span>
      <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 28, fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
        Configuration & test
      </h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Seed</label>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          style={{
            flex: 1, maxWidth: 300, padding: "6px 10px", borderRadius: 6,
            border: "1px solid rgba(var(--text-primary-rgb),0.12)",
            background: "var(--bg)", color: "var(--text-primary)", fontSize: 13, fontFamily: "monospace",
          }}
        />
        <button
          onClick={() => setSeed("lab-" + Date.now())}
          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(var(--text-primary-rgb),0.15)", background: "transparent", cursor: "pointer", fontSize: 16 }}
          title="Nouveau seed"
        >🎲</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Moteur :</span>
        <button
          onClick={() => setEngineMode("zones")}
          style={{
            padding: "4px 14px", borderRadius: 6, border: "1px solid",
            borderColor: engineMode === "zones" ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.15)",
            background: engineMode === "zones" ? "var(--accent-hotpink)" : "transparent",
            color: engineMode === "zones" ? "#fff" : "var(--text-primary)",
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          Zones (actuel)
        </button>
        <button
          onClick={() => setEngineMode("spatial")}
          style={{
            padding: "4px 14px", borderRadius: 6, border: "1px solid",
            borderColor: engineMode === "spatial" ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.15)",
            background: engineMode === "spatial" ? "var(--accent-hotpink)" : "transparent",
            color: engineMode === "spatial" ? "#fff" : "var(--text-primary)",
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          Spatial (beta)
        </button>
      </div>

      <div style={{ display: "flex", gap: 16, flexDirection: "column", marginBottom: 16 }}>
        {(["home", "away"] as const).map((side) => {
          const state = side === "home" ? home : away;
          const setter = side === "home" ? setHome : setAway;
          const chars = side === "home" ? homeChars : awayChars;
          const label = side === "home" ? "🏠 DOMICILE" : "✈️ EXTÉRIEUR";
          const accent = side === "home" ? "#22c55e" : "#3b82f6";

          return (
            <div key={side} style={{
              padding: 16, borderRadius: 10, background: "var(--surface)",
              border: "1px solid rgba(var(--text-primary-rgb),0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{label}</span>
                <select
                  value={state.nation}
                  onChange={(e) => handleNationChange(side, e.target.value)}
                  style={{
                    padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(var(--text-primary-rgb),0.12)",
                    background: "var(--bg)", color: "var(--text-primary)", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                  }}
                >
                  {LAB_NATIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <SquadEditor
                characters={chars}
                squad={state.squad}
                onChange={(sq) => handleSquadChange(side, sq)}
                onRarityChange={(charId, r) => handleRarityChange(side, charId, r)}
                onFormationChange={(f) => handleFormationChange(side, f)}
              />
              <TacticSliders side={side} state={state} />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={handleLaunch} style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: "var(--accent-hotpink)", color: "#fff", cursor: "pointer",
          fontSize: 14, fontWeight: 700, fontFamily: "inherit",
        }}>
          ▶ Lancer le match
        </button>
        <button
          onClick={handleBatch}
          disabled={batchRunning || engineMode === "spatial"}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(var(--text-primary-rgb),0.15)",
            background: batchRunning || engineMode === "spatial" ? "var(--surface)" : "transparent",
            color: batchRunning || engineMode === "spatial" ? "var(--text-muted)" : "var(--text-primary)",
            cursor: batchRunning || engineMode === "spatial" ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          {batchRunning ? "⏳ Simulation..." : `⚡ Simuler ${batchCount} matchs`}
        </button>
        <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
          N =
          <input
            type="number" min={1} max={500} value={batchCount}
            onChange={(e) => setBatchCount(Math.max(1, Math.min(500, Number(e.target.value))))}
            style={{
              width: 50, padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(var(--text-primary-rgb),0.12)",
              background: "var(--bg)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit",
            }}
          />
        </label>
      </div>

      {matchResult && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ flex: "1 1 400px" }}>
            <MatchPitch2D
              result={matchResult}
              homeTeamId={home.nation}
              awayTeamId={away.nation}
              homeLabel={home.nation}
              awayLabel={away.nation}
            />
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 240 }}>
            <div style={{
              padding: 14, borderRadius: 10, background: "var(--surface)",
              border: "1px solid rgba(var(--text-primary-rgb),0.08)", maxHeight: 460, overflowY: "auto",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📋 Événements</div>
              {matchResult.events.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Aucun événement</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {matchResult.events.map((ev, i) => (
                    <div key={i} style={{
                      fontSize: 12, padding: "4px 8px", borderRadius: 6,
                      background: ev.type === "goal" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                      borderLeft: `3px solid ${ev.type === "goal" ? "#22c55e" : ev.type === "turnover" ? "#ef4444" : "#3b82f6"}`,
                    }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", marginRight: 6 }}>{ev.minute}&apos;</span>
                      {eventLabel(ev, home.nation, away.nation, home.nation)}
                    </div>
                  ))}
                </div>
              )}
              {engineMode === "spatial" && (
                <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(234,179,8,0.1)", fontSize: 11, color: "#eab308", textAlign: "center" }}>
                  ⚠️ Phase 9 — test de mouvement uniquement, pas de score
                </div>
              )}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(var(--text-primary-rgb),0.08)" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Possession : {home.nation} {matchResult.possession[home.nation] ?? 0}% · {away.nation} {matchResult.possession[away.nation] ?? 0}%
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                  Score : {matchResult.score[home.nation] ?? 0} - {matchResult.score[away.nation] ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {batchResult && (
        <div style={{
          padding: 16, borderRadius: 10, background: "var(--surface)",
          border: "1px solid rgba(var(--text-primary-rgb),0.08)", marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            ⚡ Résultats batch ({batchResult.totalMatches} matchs)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(34,197,94,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>{batchResult.winsHome}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{home.nation} gagne</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(59,130,246,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>{batchResult.winsAway}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{away.nation} gagne</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(234,179,8,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#eab308" }}>{batchResult.draws}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Nuls</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{batchResult.avgGoalsHome.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Moy. buts {home.nation}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{batchResult.avgGoalsAway.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Moy. buts {away.nation}</div>
            </div>
          </div>
        </div>
      )}

      {matchResult && (
        <div style={{
          padding: 16, borderRadius: 10, background: "var(--surface)",
          border: "1px solid rgba(var(--text-primary-rgb),0.08)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📊 Roster complet</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
            Les OVR ci-dessous reflètent le scaling Phase 7 (FRAC × base + jitter).
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[home.nation, away.nation].map((nation) => (
              <div key={nation} style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "capitalize" }}>{nation}</div>
                {getCharacters().filter((c) => c.nation === nation).map((char) => {
                  const cs = CHARACTER_STATS[char.id];
                  const rarity = (nation === home.nation ? home.rarities : away.rarities)[char.id] ?? "common";
                  return (
                    <div key={char.id} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "3px 6px", borderRadius: 4,
                      fontSize: 11, borderBottom: "1px solid rgba(var(--text-primary-rgb),0.04)",
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: rarity === "secret" ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                          : rarity === "legendary" ? "#f59e0b" : rarity === "epic" ? "#a855f7"
                          : rarity === "rare" ? "#3b82f6" : "#6b7280",
                      }} />
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {char.name}
                      </span>
                      <span style={{ color: "var(--text-muted)", width: 22, textAlign: "right" }}>{cs.position}</span>
                      <span style={{ fontWeight: 600, width: 28, textAlign: "right" }}>{rarity}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "var(--surface)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-primary)" }}>💡 Mode d&apos;emploi</strong><br />
        Configure chaque équipe, place les joueuses, ajuste rareté et tactiques. Le mode <strong>Zones</strong>
        utilise le moteur actuel (événements, buts, stats complètes). Le mode <strong>Spatial (beta)</strong>
        simule uniquement les déplacements des 22 joueuses en mètres réels — pas de score, pas d&apos;événements,
        idéal pour valider la fluidité du mouvement spatial. Le mode batch n&apos;est pas disponible en spatial.
      </div>
    </div>
  );
}
