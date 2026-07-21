"use client";

import { CHARACTERS } from "@/data/characters";
import { getElementColor } from "@/data/characters";
import CARDS from "@/data/cards";

export default function CharactersView({
  affinityXp = {},
  affinityCheckinDate,
  selectedCharacterId,
  onSelect,
  onCheckin,
}: {
  affinityXp?: Record<string, number>;
  affinityCheckinDate?: string | null;
  selectedCharacterId?: string | null;
  onSelect?: (id: string) => void;
  onCheckin?: (characterId: string) => Promise<any>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const canCheckinAnywhere = affinityCheckinDate !== today;

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Characters
        </span>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px", margin: 0, lineHeight: 1.1, background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          characters
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          Build affinity with each character. Collect their cards and unlock exclusive artwork.
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
      }}>
        {CHARACTERS.filter((c) => c.revealed).map((character) => {
          const xp = affinityXp[character.id] ?? 0;
          const portraitCard = CARDS.find((c) => c.idol === character.name && c.imageSrc);
          const isSelected = selectedCharacterId === character.id;
          const elemColor = getElementColor(character.element);

          const pct = Math.min(100, Math.round((xp / 100) * 100));

          return (
            <div
              key={character.id}
              onClick={() => onSelect?.(character.id)}
              style={{
                cursor: "pointer",
                borderRadius: 14,
                overflow: "hidden",
                background: "rgba(var(--text-primary-rgb),0.03)",
                border: isSelected
                  ? "2px solid var(--accent-purple)"
                  : "2px solid rgba(var(--text-primary-rgb),0.08)",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-purple)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isSelected ? "var(--accent-purple)" : "rgba(var(--text-primary-rgb),0.08)"; }}
            >
              {/* Portrait */}
              <div style={{
                position: "relative",
                width: "100%",
                height: 240,
                overflow: "hidden",
                background: `linear-gradient(180deg, ${character.color}44 0%, ${character.color}11 100%)`,
              }}>
                {portraitCard?.imageSrc ? (
                  <img
                    src={portraitCard.imageSrc}
                    alt={character.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center 20%",
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 64, opacity: 0.3, color: character.color,
                  }}>
                    {character.name[0]}
                  </div>
                )}

                {/* Name overlay */}
                <div style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  padding: "32px 14px 14px",
                  background: "linear-gradient(0deg, rgba(17,17,17,0.75) 0%, transparent 100%)",
                }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                    {character.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-display)" }}>
                      {character.archetype}
                    </span>
                    {character.label && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>
                        {character.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Element + faction bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px 6px" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 4,
                  background: `${elemColor}22`,
                  border: `2px solid ${elemColor}44`,
                  fontSize: 10, fontWeight: 700, color: elemColor,
                  fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "1px",
                }}>
                  {character.element}
                </span>
              </div>

              {/* XP bar */}
              <div style={{ padding: "0 14px" }}>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(var(--text-primary-rgb),0.08)", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 2,
                    background: `linear-gradient(90deg, ${character.color}, var(--accent-purple))`,
                    transition: "width 0.3s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
                  <span>{xp} XP</span>
                  <span>Lv.{Math.floor(xp / 100) + 1}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, padding: "10px 14px 14px" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect?.(character.id); }}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, border: "2px solid rgba(var(--text-primary-rgb),0.12)", cursor: "pointer",
                    background: "transparent", color: "var(--text-primary)",
                    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
                  }}
                >
                  Details
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (canCheckinAnywhere) await onCheckin?.(character.id);
                  }}
                  disabled={!canCheckinAnywhere}
                  style={{
                    padding: "8px 12px", borderRadius: 8, border: "none", cursor: canCheckinAnywhere ? "pointer" : "default",
                    background: canCheckinAnywhere
                      ? `linear-gradient(135deg, ${character.color}, var(--accent-purple))`
                      : "rgba(var(--text-primary-rgb),0.06)",
                    color: canCheckinAnywhere ? "var(--surface-white)" : "var(--text-disabled)",
                    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  {canCheckinAnywhere ? "+10 XP" : "\u2713"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {CHARACTERS.some((c) => !c.revealed) && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{
            fontSize: 12, fontWeight: 700, letterSpacing: "2px",
            color: "var(--text-disabled)", textTransform: "uppercase", marginBottom: 8,
          }}>
            Coming soon
          </h3>
          <div style={{ display: "flex", gap: 12 }}>
            {CHARACTERS.filter((c) => !c.revealed).map((c) => (
              <div key={c.id} style={{
                width: 120, padding: "24px 16px", borderRadius: 12, textAlign: "center",
                background: "rgba(var(--text-primary-rgb),0.03)", border: "2px dashed rgba(var(--text-primary-rgb),0.06)",
                opacity: 0.4,
              }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>?</div>
                <div style={{ fontSize: 12, color: "var(--text-disabled)", fontWeight: 600 }}>{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
