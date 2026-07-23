"use client";

import { getCharacters } from "@/data/footballCards";
import { CHARACTER_STATS } from "@/data/characterStats";

const NATION_FLAGS: Record<string, string> = {
  france: "🇫🇷",
  allemagne: "🇩🇪",
  angleterre: "🇬🇧",
  italie: "🇮🇹",
  espagne: "🇪🇸",
  bresil: "🇧🇷",
  japon: "🇯🇵",
  argentine: "🇦🇷",
};

const STYLE_LABELS: Record<string, string> = {
  percussion: "Percussion",
  vista: "Vista",
  pressing: "Pressing",
  elevation: "Elevation",
  sangFroid: "Sang-froid",
};


export default function CharactersView({
  affinityXp = {},
  onSelect,
}: {
  affinityXp?: Record<string, number>;
  onSelect?: (id: string) => void;
}) {
  const characters = getCharacters();

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Players
        </span>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px", margin: 0, lineHeight: 1.1, background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          players
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          Get to know each player. Collect their cards and discover their stats.
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
      }}>
        {characters.map((character) => {
          const xp = affinityXp[character.id] ?? 0;
          const flag = NATION_FLAGS[character.nation] ?? "";
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
                border: "2px solid rgba(var(--text-primary-rgb),0.08)",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-purple)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--text-primary-rgb),0.08)"; }}
            >
              <div style={{
                position: "relative",
                width: "100%",
                height: 240,
                overflow: "hidden",
                background: "linear-gradient(180deg, #4a4a6a44 0%, #4a4a6a11 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 64, opacity: 0.3,
                }}>
                  {character.name[0]}
                </div>

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
                    <span style={{ fontSize: 14, lineHeight: 1 }}>
                      {flag}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-display)" }}>
                      {CHARACTER_STATS[character.id]?.position ?? character.defaultPosition}
                    </span>
                    {character.isCaptain && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>
                        CAPTAIN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px 6px" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 4,
                  background: "rgba(201,177,255,0.22)",
                  border: "2px solid rgba(201,177,255,0.44)",
                  fontSize: 10, fontWeight: 700, color: "var(--accent-purple)",
                  fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "1px",
                }}>
                  {STYLE_LABELS[character.defaultStyle] ?? character.defaultStyle}
                </span>
              </div>

              <div style={{ padding: "0 14px" }}>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(var(--text-primary-rgb),0.08)", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 2,
                    background: "linear-gradient(90deg, var(--accent-purple), var(--accent-hotpink))",
                    transition: "width 0.3s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
                  <span>{xp} XP</span>
                  <span>Lv.{Math.floor(xp / 100) + 1}</span>
                </div>
              </div>

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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
