"use client";

import { getCharacter, getElementColor } from "@/data/characters";
import { AFFINITY_TIERS, getAffinityTier } from "@/lib/affinityConfig";
import AffinityBar from "@/components/AffinityBar";
import CharacterGallery from "@/components/CharacterGallery";
import PersonalityAxis from "@/components/PersonalityAxis";

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
  const character = getCharacter(characterId);
  if (!character) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Character not found.</div>;

  const currentTier = getAffinityTier(affinityXp);
  const ownedCount = Object.values(ownedCards).reduce((a, b) => a + b, 0);
  const today = new Date().toISOString().slice(0, 10);
  const canCheckin = affinityCheckinDate !== today;

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
          background: `linear-gradient(135deg, ${character.color}44, ${character.color}11)`,
          flexShrink: 0,
        }} />
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text-primary)", margin: 0 }}>
            {character.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            {character.label && (
              <span style={{ fontSize: 12, color: "var(--accent-purple)", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                {character.label}
              </span>
            )}
            <span style={{
              padding: "2px 8px", borderRadius: 4,
              background: `linear-gradient(135deg, ${getElementColor(character.element)}22, transparent)`,
              border: `2px solid ${getElementColor(character.element)}44`,
              fontSize: 10, fontWeight: 700, color: getElementColor(character.element),
              fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "1px",
            }}>
              {character.element}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
              {character.archetype}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.5 }}>
            {character.tagline}
          </p>
        </div>
      </div>

      <AffinityBar xp={affinityXp} />

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
        {canCheckin ? `Greet ${character.name} (+10 XP)` : "\u2713 Already greeted today"}
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
          <StatCell label="Age" value={character.age} />
          <StatCell label="Height" value={character.height} />
          <StatCell label="Origin" value={character.origin} />
          <StatCell label="Birthday" value={character.birthday} />
          <StatCell label="Specialty" value={character.specialty} />
          <StatCell label="Faction" value={character.label ?? "\u2014"} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "2px" }}>
          Personality
        </h3>
        <PersonalityAxis
          leftLabel="Charm"
          rightLabel="Charisma"
          value={character.personality.charm}
          leftColor="#F48FB1"
          rightColor="#A87FFF"
        />
        <PersonalityAxis
          leftLabel="Gentleness"
          rightLabel="Intensity"
          value={character.personality.gentleness}
          leftColor="#F48FB1"
          rightColor="#E53935"
        />
        <PersonalityAxis
          leftLabel="Calm"
          rightLabel="Energy"
          value={character.personality.energy}
          leftColor="#81D4FA"
          rightColor="#FDD835"
        />
        <PersonalityAxis
          leftLabel="Timidity"
          rightLabel="Confidence"
          value={character.personality.confidence}
          leftColor="#BDBDBD"
          rightColor="#FFB74D"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "2px" }}>
          Unlockables
        </h3>
        {AFFINITY_TIERS.filter((t) => t.reward).map((t) => {
          const unlocked = affinityXp >= t.xpRequired;
          return (
            <div key={t.tier} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 10,
              background: unlocked ? "rgba(var(--text-primary-rgb),0.05)" : "rgba(var(--text-primary-rgb),0.03)",
              border: `2px solid ${unlocked ? "rgba(var(--text-primary-rgb),0.10)" : "rgba(var(--text-primary-rgb),0.06)"}`,
              opacity: unlocked ? 1 : 0.45,
            }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-disabled)", fontFamily: "var(--font-mono, monospace)" }}>
                  {unlocked
                    ? `Unlocked \u2014 ${t.reward}`
                    : `${t.xpRequired - affinityXp} XP to unlock`}
                </div>
              </div>
              {unlocked && <span style={{ fontSize: 16 }}>\u2705</span>}
            </div>
          );
        })}
      </div>

      {/* Reward visuals for unlocked tiers */}
      {AFFINITY_TIERS.filter((t) => t.reward && affinityXp >= t.xpRequired).map((t) => (
        <div key={`reward-${t.tier}`} style={{
          marginTop: -4, padding: "8px 12px", borderRadius: 8,
          background: "rgba(var(--text-primary-rgb),0.03)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {t.reward === "alt_portrait" && <span style={{ fontSize: 20 }}>\uD83D\uDDBC\uFE0F</span>}
          {t.reward === "alt_outfit" && <span style={{ fontSize: 20 }}>\uD83D\uDC57</span>}
          {t.reward === "mini_clip" && <span style={{ fontSize: 20 }}>\uD83C\uDFAC</span>}
          {t.reward === "exclusive_outfit" && <span style={{ fontSize: 20 }}>\u2728</span>}
          {t.reward === "full_gallery" && <span style={{ fontSize: 20 }}>\uD83C\uDFC6</span>}
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {t.reward === "alt_portrait" && "Alternate portrait unlocked"}
            {t.reward === "alt_outfit" && "Alternate outfit unlocked"}
            {t.reward === "mini_clip" && "Mini clip unlocked (3s)"}
            {t.reward === "exclusive_outfit" && "Exclusive outfit unlocked"}
            {t.reward === "full_gallery" && "Full gallery access"}
          </span>
        </div>
      ))}

      <CharacterGallery
        characterName={character.name}
        ownedCards={ownedCards}
      />

      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 700 }}>{character.bio}</p>
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
