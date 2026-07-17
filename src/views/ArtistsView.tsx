"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import FanLevelBar from "@/components/FanLevelBar";
import StyledSelect from "@/components/StyledSelect";
import { GROUPS, type GroupInfo, type MemberInfo, type TrackInfo } from "@/data/artists";
import CARDS, { rarityFromReference } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import { BIAS_COOLDOWN_DAYS } from "@/lib/gameConfig";
import { RARITY_LETTER, RARITY_BG, RARITY_FG } from "@/lib/rarityTheme";
import ProfileStatGrid, { type StatEntry } from "@/components/ProfileStatGrid";
import { IconChevronLeft } from "@/components/Icons";

// ─── Small shared bits ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, letterSpacing: "2px",
      color: "rgba(var(--text-primary-rgb),0.35)", textTransform: "uppercase",
    }}>
      ✦ {children}
    </span>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
        padding: "6px 12px", borderRadius: 8,         border: "2px solid rgba(var(--text-primary-rgb),0.12)",
        background: "rgba(var(--surface-white-rgb),0.6)", cursor: "pointer",
        fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
        color: "rgba(var(--text-primary-rgb),0.6)",
      }}
    >
      <IconChevronLeft size={14} /> {label}
    </button>
  );
}

function Avatar({ name, color, size = 64, image }: { name: string; color: string; size?: number; image?: string }) {
  const initial = name === "???" ? "?" : name.charAt(0);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: image ? "none" : `linear-gradient(135deg, ${color}, rgba(var(--surface-white-rgb),0.6))`,
        border: "2px solid var(--text-primary)",
        boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
      }}
    >
      {image ? (
        <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span style={{
          fontFamily: "var(--font-display)", fontSize: size * 0.4, fontWeight: 700, color: "var(--text-primary)",
        }}>
          {initial}
        </span>
      )}
    </div>
  );
}

function SocialTile({ label, handle, icon }: { label: string; handle?: string; icon: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 130, display: "flex", flexDirection: "column", gap: 4,
      padding: "12px 14px", borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.5)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      border: "2px solid rgba(255,158,196,0.08)",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
      <span style={{ fontSize: 12, color: "rgba(var(--text-primary-rgb),0.35)" }}>
        {handle ? `${handle} · ` : ""}Coming soon ✨
      </span>
    </div>
  );
}

function TrackTile({ track }: { track: TrackInfo }) {
  return (
    <div
      className="shrink-0 w-[140px] lg:w-full"
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div style={{
        aspectRatio: "1/1", borderRadius: 12,
        background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple), var(--holo-c))",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "2px solid var(--text-primary)",
        fontSize: 28,
      }}>
        {track.type === "mv" ? "▶" : "♪"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{track.title}</span>
        <span style={{ fontSize: 11, color: "rgba(var(--text-primary-rgb),0.35)" }}>
          {track.type === "mv" ? "Music Video" : "Song"}
          {track.duration ? ` · ${track.duration}` : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Level 0: Member grid ───────────────────────────────────────────────────

function MemberGrid({
  onSelectMember,
}: {
  onSelectMember: (groupId: string, memberId: string) => void;
}) {
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => { setGroupFilter("all"); }, [genderFilter]);

  const genders = useMemo(() => [...new Set(GROUPS.map((g) => g.gender).filter(Boolean))], []);

  const genderOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Groups" }];
    if (genders.includes("female")) opts.push({ value: "female", label: "Girl Groups" });
    if (genders.includes("male")) opts.push({ value: "male", label: "Boy Groups" });
    return opts;
  }, [genders]);

  const groupOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All" }];
    GROUPS.filter((g) => {
      if (genderFilter === "all") return true;
      return g.gender === genderFilter;
    }).forEach((g) => opts.push({ value: g.id, label: g.name }));
    return opts;
  }, [genderFilter]);

  const filtered = useMemo(() => {
    const result: { member: MemberInfo; group: GroupInfo }[] = [];
    for (const group of GROUPS) {
      if (genderFilter !== "all" && group.gender !== genderFilter) continue;
      if (groupFilter !== "all" && group.id !== groupFilter) continue;
      for (const member of group.members) {
        if (member.revealed) result.push({ member, group });
      }
    }
    return result;
  }, [genderFilter, groupFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{
          fontSize: 13, color: "rgba(var(--text-primary-rgb),0.35)", fontWeight: 500,
          letterSpacing: "4px", textTransform: "uppercase",
        }}>
          ✦ IdolBias
        </span>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--surface-white))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", margin: 0, lineHeight: 1.1,
        }}>
          artists
        </h1>
        <span style={{ fontSize: 15, color: "rgba(var(--text-primary-rgb),0.5)", marginTop: 4 }}>
          Meet the members behind your photocards.
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StyledSelect options={genderOptions} value={genderFilter} onChange={setGenderFilter} />
        <StyledSelect options={groupOptions} value={groupFilter} onChange={setGroupFilter} />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 20,
      }}>
        {filtered.map(({ member, group }) => {
          const memberCards = CARDS.filter((c) => c.idol === member.stageName);
          const coverSrc = memberCards[0]?.imageSrc;

          return (
            <button
              key={`${group.id}-${member.id}`}
              onClick={() => onSelectMember(group.id, member.id)}
              style={{
                display: "flex", flexDirection: "column", gap: 0,
                cursor: "pointer", border: "none", background: "none", padding: 0,
                transition: "transform 0.2s, filter 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.filter = "brightness(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; }}
            >
              <div style={{
                borderRadius: 16, overflow: "hidden",
                border: "2px solid var(--text-primary)",
                boxShadow: "5px 5px 0px rgba(var(--text-primary-rgb),0.9)",
                aspectRatio: "3/4", width: "100%",
                position: "relative",
              }}>
                {coverSrc ? (
                  <img src={coverSrc} alt={member.stageName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : member.profileImage ? (
                  <img src={member.profileImage} alt={member.stageName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(170deg, ${member.color}dd 0%, ${group.color}44 60%, ${member.color}22 100%)`,
                  }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 900, color: "var(--surface-white)", textShadow: "3px 3px 0 rgba(0,0,0,0.3)" }}>
                      {member.stageName[0]}
                    </span>
                  </div>
                )}

                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent 0%, rgba(0,0,0,0.65) 60%)",
                  padding: "32px 12px 10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: group.gender === "female" ? "var(--accent-hotpink)" : "#4A90D9",
                      boxShadow: group.gender === "female"
                        ? "0 0 6px var(--accent-hotpink)"
                        : "0 0 6px #4A90D9",
                    }} />
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800,
                      color: "var(--surface-white)", textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
                      lineHeight: 1.2,
                    }}>
                      {member.stageName}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Level 1: Group detail ──────────────────────────────────────────────────

function GroupDetail({
  group, onBack, onSelectMember,
}: {
  group: GroupInfo;
  onBack: () => void;
  onSelectMember: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <BackButton label="Artists" onClick={onBack} />

      {/* Hero */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 8, padding: 24, borderRadius: 16,
        background: `linear-gradient(135deg, ${group.color}14, rgba(var(--surface-white-rgb),0.5))`,
        border: "2px solid rgba(255,158,196,0.08)",
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 30, letterSpacing: "-0.5px",
          color: "var(--text-primary)",
        }}>
          {group.name}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: group.color }}>{group.tagline}</span>
        <span style={{ fontSize: 14, color: "rgba(var(--text-primary-rgb),0.6)", lineHeight: 1.5, maxWidth: 560 }}>
          {group.bio}
        </span>
        {group.debutDate && (
          <span style={{ fontSize: 12, color: "rgba(var(--text-primary-rgb),0.35)", marginTop: 4 }}>
            Debut: {group.debutDate}
          </span>
        )}
      </div>

      {/* Group info */}
      {(group.agency || group.genre || group.fandomName || group.officialColors) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel>Group info</SectionLabel>
          <ProfileStatGrid
            stats={[
              group.agency && { label: "Agency", value: group.agency },
              group.genre && { label: "Genre", value: group.genre },
              group.fandomName && { label: "Fandom", value: group.fandomName },
              group.debutDate && { label: "Debut", value: group.debutDate },
              { label: "Members", value: String(group.members.length) },
              group.officialColors && { label: "Colors", swatches: group.officialColors },
            ].filter(Boolean) as StatEntry[]}
          />
        </div>
      )}

      {/* Members */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionLabel>Members</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {group.members.map((member) => {
            const memberCards = CARDS.filter((c) => c.idol === member.stageName);
            const coverSrc = memberCards[0]?.imageSrc;
            return member.revealed ? (
              <button
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                style={{
                  position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  border: "2px solid var(--text-primary)",
                  boxShadow: "4px 4px 0px rgba(var(--text-primary-rgb),0.9)",
                  aspectRatio: "3/4",
                }}
              >
                {coverSrc ? (
                  <img src={coverSrc} alt={member.stageName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${member.color}, rgba(var(--text-primary-rgb),0.3))` }} />
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  padding: "20px 10px 10px",
                  textAlign: "left",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
                    {member.stageName}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                    {member.position}
                  </div>
                </div>
              </button>
            ) : (
              <div
                key={member.id}
                style={{
                  position: "relative", borderRadius: 14, overflow: "hidden",
                  border: "2px solid var(--text-primary)", opacity: 0.55,
                  aspectRatio: "3/4",
                  background: "var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: "var(--surface-white)" }}>?</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Music & Videos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionLabel>Music &amp; Videos</SectionLabel>
        <div className="flex gap-3 overflow-x-auto pb-1.5 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {group.discography.map((track) => (
            <TrackTile key={track.id} track={track} />
          ))}
        </div>
      </div>

      {/* Social */}
      {(group.social.photoHandle || group.social.feedHandle) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel>Social</SectionLabel>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {group.social.photoHandle && <SocialTile label="Photo feed" handle={group.social.photoHandle} icon="📸" />}
            {group.social.feedHandle && <SocialTile label="Text feed" handle={group.social.feedHandle} icon="💬" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Level 2: Member detail ──────────────────────────────────────────────────

function MemberDetail({
  member, group, onBack, bias, onSetBias, onVisitMember, getFanXp, biasCooldown, onOpenCosmo, isSubscribed, onToggleSubscribe,
}: {
  member: MemberInfo;
  group: GroupInfo;
  onBack: () => void;
  bias?: string | null;
  onSetBias?: (idol: string) => void;
  onVisitMember?: () => void;
  getFanXp?: (idol: string) => number;
  biasCooldown?: number | null;
  onOpenCosmo?: (memberId: string) => void;
  isSubscribed?: boolean;
  onToggleSubscribe?: () => void;
}) {
  useEffect(() => { onVisitMember?.(); }, [member.id]);
  const memberCards = CARDS.filter((c) => c.idol === member.stageName);
  const isBias = bias === member.stageName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <BackButton label={group.name} onClick={onBack} />

      {/* Hero */}
      <div style={{
        display: "flex", gap: 16, alignItems: "flex-start", padding: 24, borderRadius: 16,
        background: `linear-gradient(135deg, ${member.color}14, rgba(var(--surface-white-rgb),0.5))`,
        border: "2px solid rgba(255,158,196,0.08)", flexWrap: "wrap",
      }}>
        <Avatar name={member.stageName} color={member.color} size={84} image={member.profileImage} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 200 }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: "-0.5px",
            color: "var(--text-primary)",
          }}>
            {member.stageName}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: member.color }}>
            {member.position} · {group.name}
          </span>
          <span style={{ fontSize: 14, color: "rgba(var(--text-primary-rgb),0.6)", lineHeight: 1.5, maxWidth: 480 }}>
            {member.bio}
          </span>
          <FanLevelBar xp={getFanXp?.(member.stageName) ?? 0} color={member.color} />
          {member.revealed && onSetBias && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button
              onClick={() => onSetBias(member.stageName)}
              style={{
                alignSelf: "flex-start", padding: "8px 16px", borderRadius: 10,
                border: "none", cursor: "pointer", fontFamily: "var(--font-display)",
                fontSize: 13, fontWeight: 700,
                background: isBias ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "rgba(var(--surface-white-rgb),0.7)",
                color: "var(--text-primary)",
                boxShadow: isBias ? "3px 3px 0px rgba(var(--text-primary-rgb),0.9)" : "none",
                outline: isBias ? "2px solid var(--text-primary)" : "2px solid rgba(var(--text-primary-rgb),0.12)",
                outlineOffset: -2,
              }}
            >
              {isBias ? "💖 Your bias" : "Set as bias"}
            </button>
            {biasCooldown !== null && biasCooldown !== undefined && biasCooldown > 0 && !isBias && (
              <span style={{ fontSize: 11, color: "var(--accent-pink)", fontWeight: 600 }}>
                ⏳ Can change again in {biasCooldown} day(s)
              </span>
            )}
          </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onToggleSubscribe && (
              <button
                onClick={onToggleSubscribe}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "none",
                  cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
                  background: isSubscribed ? "var(--accent-hotpink)" : "rgba(var(--surface-white-rgb),0.7)",
                  color: isSubscribed ? "var(--surface-white)" : "var(--text-primary)",
                  outline: isSubscribed ? "none" : "2px solid rgba(var(--text-primary-rgb),0.12)",
                  outlineOffset: -2,
                }}
              >
                {isSubscribed ? "Following" : "Follow"}
              </button>
            )}
            {member.revealed && onOpenCosmo && (
              <button
                onClick={() => onOpenCosmo(member.id)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "none",
                  cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg, var(--accent-purple), var(--holo-c, #9EE6FF))",
                  color: "#fff", boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
                }}
              >
                ✦ Cosmo Room
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile stats */}
      {member.revealed && (
        <>
          {(member.birthName || member.birthday || member.zodiac || member.height || member.weight || member.bloodType || member.mbti || member.nationality) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionLabel>Profile</SectionLabel>
              <ProfileStatGrid
                stats={[
                  member.birthName && { label: "Birth name", value: member.birthName },
                  member.birthday && { label: "Birthday", value: member.birthday },
                  member.zodiac && { label: "Zodiac", value: member.zodiac },
                  member.height && { label: "Height", value: member.height },
                  member.weight && { label: "Weight", value: member.weight },
                  member.bloodType && { label: "Blood type", value: member.bloodType },
                  member.mbti && { label: "MBTI", value: member.mbti },
                  member.nationality && { label: "Nationality", value: member.nationality },
                  member.position && { label: "Position", value: member.position },
                ].filter(Boolean) as StatEntry[]}
              />
            </div>
          )}

          {member.funFacts && member.funFacts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionLabel>Fun facts</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {member.funFacts.map((fact, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(var(--surface-white-rgb),0.5)",
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    border: "2px solid rgba(255,158,196,0.02)",
                    fontSize: 13, color: "rgba(var(--text-primary-rgb),0.7)",
                    lineHeight: 1.4,
                  }}>
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}

          {member.specialties && member.specialties.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionLabel>Specialties</SectionLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {member.specialties.map((s) => (
                  <span key={s} style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: `${member.color}1a`,
                    color: member.color,
                    fontSize: 12, fontWeight: 700,
                    fontFamily: "var(--font-sans, monospace)",
                    letterSpacing: "0.5px",
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionLabel>Cards</SectionLabel>
        {memberCards.length === 0 ? (
          <div style={{
            padding: "24px 16px", borderRadius: 14, textAlign: "center",
            background: "rgba(var(--surface-white-rgb),0.4)", border: "2px dashed rgba(var(--text-primary-rgb),0.15)",
            fontSize: 13, color: "rgba(var(--text-primary-rgb),0.35)",
          }}>
            No cards revealed yet ✨
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 lg:grid lg:grid-cols-6 lg:gap-2.5 lg:overflow-visible lg:pb-0">
            {memberCards.map((card) => {
              const rarity = rarityFromReference(card.reference);
              return (
                <div key={card.id} className="shrink-0 w-[100px] lg:w-full" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <img
                    src={card.imageSrc}
                    alt={card.idol}
                    style={{ width: "100%", aspectRatio: "896/1152", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "4px 8px" }}>
                    <span style={{
                      display: "inline-block", padding: "1px 6px", borderRadius: 3,
                      background: RARITY_BG[rarity], color: RARITY_FG[rarity],
                      fontSize: 10, fontWeight: 700, letterSpacing: "1px",
                      fontFamily: "var(--font-sans)",
                    }}>
                      {RARITY_LETTER[rarity]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Social */}
      {(member.social.photoHandle || member.social.feedHandle) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel>Social</SectionLabel>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {member.social.photoHandle && <SocialTile label="Photo feed" handle={member.social.photoHandle} icon="📸" />}
            {member.social.feedHandle && <SocialTile label="Text feed" handle={member.social.feedHandle} icon="💬" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root view ───────────────────────────────────────────────────────────────

export default function ArtistsView({
  bias, onSetBias, onVisitMember, getFanXp, biasCooldown, onOpenCosmo,
}: {
  bias?: string | null;
  onSetBias?: (idol: string) => void;
  onVisitMember?: () => void;
  getFanXp?: (idol: string) => number;
  biasCooldown?: number | null;
  onOpenCosmo?: (memberId: string) => void;
}) {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  const fetchSubs = useCallback(async () => {
    try {
      const res = await fetch("/api/feed/subscriptions");
      const data = await res.json();
      setSubscriptions((data.subscriptions ?? []).map((s: { memberId: string }) => s.memberId));
    } catch {}
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const toggleSubscription = useCallback(async (memId: string, groupId: string) => {
    const currently = subscriptions.includes(memId);
    setSubscriptions((prev) =>
      currently ? prev.filter((id) => id !== memId) : [...prev, memId]
    );
    try {
      const endpoint = currently ? "/api/feed/unsubscribe" : "/api/feed/subscribe";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memId, groupId }),
      });
    } catch {
      setSubscriptions((prev) =>
        currently ? [...prev, memId] : prev.filter((id) => id !== memId)
      );
    }
  }, [subscriptions]);

  const group = groupId ? GROUPS.find((g) => g.id === groupId) ?? null : null;
  const member = group && memberId ? group.members.find((m) => m.id === memberId) ?? null : null;

  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[1100px]"
      style={{ padding: "20px 16px 48px" }}
    >
      {!group && <MemberGrid onSelectMember={(gid, mid) => { setGroupId(gid); setMemberId(mid); }} />}
      {group && !member && (
        <GroupDetail group={group} onBack={() => setGroupId(null)} onSelectMember={setMemberId} />
      )}
      {group && member && (
        <MemberDetail
          member={member}
          group={group}
          onBack={() => setMemberId(null)}
          bias={bias}
          onSetBias={onSetBias}
          onVisitMember={onVisitMember}
          getFanXp={getFanXp}
          biasCooldown={biasCooldown}
          onOpenCosmo={onOpenCosmo}
          isSubscribed={subscriptions.includes(member.id)}
          onToggleSubscribe={() => toggleSubscription(member.id, group.id)}
        />
      )}
    </div>
  );
}
