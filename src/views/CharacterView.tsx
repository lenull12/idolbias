"use client";

import { getCharacterById } from "@/data/footballCards";
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


export default function CharacterView({
  characterId,
  affinityXp = 0,
  affinityCheckinDate,
  ownedCards = {},
  onCheckin,
  onBack,
}: {
  characterId: string;
  affinityXp?: number;
  affinityCheckinDate?: string | null;
  ownedCards?: Record<string, number>;
  onCheckin?: (characterId: string) => Promise<any>;
  onBack?: () => void;
}) {
  const character = getCharacterById(characterId);
  if (!character) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Player not found.</div>;

  const ownedCount = Object.values(ownedCards).reduce((a, b) => a + b, 0);
  const today = new Date().toISOString().slice(0, 10);
  const canCheckin = affinityCheckinDate !== today;
  const flag = NATION_FLAGS[character.nation] ?? "";

  const currentTier = (() => {
    if (affinityXp >= 500) return { label: "Legendary", xpRequired: 500 };
    if (affinityXp >= 300) return { label: "Epic", xpRequired: 300 };
    if (affinityXp >= 150) return { label: "Rare", xpRequired: 150 };
    if (affinityXp >= 50) return { label: "Fan", xpRequired: 50 };
    return { label: "Newcomer", xpRequired: 0 };
  })();

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

      {onBack && (
        <button onClick={onBack} style={{
          alignSelf: "flex-start", padding: "6px 14px", borderRadius: 8,
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: "transparent", color: "var(--text-secondary)",
          cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)",
        }}>
          &larr; Back
        </button>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent-purple)44, var(--accent-purple)11)",
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, fontWeight: 800, color: "var(--accent-purple)",
        }}>
          {character.name[0]}
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text-primary)", margin: 0 }}>
            {character.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>
            <span style={{
              padding: "2px 8px", borderRadius: 4,
              background: "rgba(201,177,255,0.22)",
              border: "2px solid rgba(201,177,255,0.44)",
              fontSize: 10, fontWeight: 700, color: "var(--accent-purple)",
              fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "1px",
            }}>
              {STYLE_LABELS[character.defaultStyle] ?? character.defaultStyle}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
              {character.nation.charAt(0).toUpperCase() + character.nation.slice(1)}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.5 }}>
            {character.isCaptain ? "Team Captain" : `${CHARACTER_STATS[character.id]?.position ?? character.defaultPosition}`}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Affinity</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{affinityXp} / 500 XP</span>
        </div>
        <div style={{ width: "100%", height: 10, borderRadius: 4, background: "rgba(var(--text-primary-rgb),0.08)", overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(100, (affinityXp / 500) * 100)}%`,
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, var(--accent-hotpink), var(--accent-purple))",
            transition: "width 0.4s",
          }} />
        </div>
      </div>

      <button
        onClick={() => onCheckin?.(characterId)}
        disabled={!canCheckin}
        style={{
          padding: "12px 20px", borderRadius: 10, border: "none", cursor: canCheckin ? "pointer" : "default",
          background: canCheckin
            ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
            : "rgba(var(--text-primary-rgb),0.06)",
          color: canCheckin ? "var(--surface-white)" : "var(--text-disabled)",
          fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)",
          width: "100%",
        }}
      >
        {canCheckin ? `Greet ${character.name.split(" ")[0]} (+10 XP)` : "\u2713 Already greeted today"}
      </button>

      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Cards", value: ownedCount },
          { label: "Tier", value: currentTier.label },
          { label: "Total XP", value: affinityXp },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", padding: "14px 8px", borderRadius: 10,
            background: "rgba(var(--text-primary-rgb),0.03)", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: "var(--text-primary)" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "2px" }}>
          Profile
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}>
          <StatCell label="Nation" value={character.nation.charAt(0).toUpperCase() + character.nation.slice(1)} />
          <StatCell label="Position" value={CHARACTER_STATS[character.id]?.position ?? character.defaultPosition} />
          <StatCell label="Style" value={STYLE_LABELS[character.defaultStyle] ?? character.defaultStyle} />
          <StatCell label="Role" value={character.isCaptain ? "Captain" : "Player"} />
          {CHARACTER_STATS[character.id]?.nickname && <StatCell label="Nickname" value={CHARACTER_STATS[character.id]!.nickname} />}
        </div>
      </div>

      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 700 }}>
        {character.name} is a {CHARACTER_STATS[character.id]?.position ?? character.defaultPosition} from {character.nation}, known for their {STYLE_LABELS[character.defaultStyle]?.toLowerCase() ?? character.defaultStyle} playing style.
      </p>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 8,
      background: "rgba(var(--text-primary-rgb),0.03)",
      border: "2px solid rgba(var(--text-primary-rgb),0.06)",
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        {value}
      </span>
      <span style={{ fontSize: 9, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "1px" }}>
        {label}
      </span>
    </div>
  );
}
