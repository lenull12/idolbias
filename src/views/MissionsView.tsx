"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MissionRow from "@/components/MissionRow";
import { useCountdown } from "@/lib/useCountdown";
import type { MissionDef, MissionState, LifetimeMissionDef, LifetimeTier, MissionDifficulty } from "@/lib/gameConfig";

type TabKey = "daily" | "weekly" | "achievements";

type Props = {
  dailyMissions: MissionState[];
  weeklyMissions: MissionState[];
  lifetimeMissions: LifetimeMissionState[];
  eventMissions?: any[];
  onClaimDaily: (id: string) => void;
  onClaimWeekly: (id: string) => void;
  onClaimLifetime: (id: string) => void;
  dailyResetAt?: number | null;
  weeklyResetAt?: number | null;
};

type LifetimeMissionState = {
  def: LifetimeMissionDef;
  currentValue: number;
  nextTier: LifetimeTier | null;
  nextTierIndex: number | null;
  claimedTierKeys: string[];
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "achievements", label: "Achievements" },
];

const DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  easy: "#22c55e",
  normal: "#f97316",
  hard: "#ef4444",
};

function DifficultyDot({ difficulty }: { difficulty?: MissionDifficulty }) {
  if (!difficulty) return null;
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: DIFFICULTY_COLORS[difficulty],
      flexShrink: 0,
    }} title={difficulty} />
  );
}

export default function MissionsView({
  dailyMissions, weeklyMissions, lifetimeMissions, eventMissions = [],
  onClaimDaily, onClaimWeekly, onClaimLifetime,
  dailyResetAt, weeklyResetAt,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const dailyCountdown = useCountdown(dailyResetAt ?? null);
  const weeklyCountdown = useCountdown(weeklyResetAt ?? null);

  const claimableDaily = dailyMissions.filter((m) => m.complete && !m.claimed).length;
  const claimableWeekly = weeklyMissions.filter((m) => m.complete && !m.claimed).length;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    const idx = TABS.findIndex((t) => t.key === activeTab);
    if (dx < -40 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1].key);
    if (dx > 40 && idx > 0) setActiveTab(TABS[idx - 1].key);
  };

  const dailyClaimed = dailyMissions.filter((m) => m.claimed).length;
  const weeklyClaimed = weeklyMissions.filter((m) => m.claimed).length;
  const claimableLifetime = lifetimeMissions.filter((lm) => lm.nextTier !== null && lm.currentValue >= lm.nextTier.threshold).length;
  const lifetimeUnlocked = lifetimeMissions.reduce((acc, lm) => acc + lm.claimedTierKeys.length, 0);
  const lifetimeTotal = lifetimeMissions.reduce((acc, lm) => acc + lm.def.tiers.length, 0);

  return (
    <div
      className="mx-auto max-w-[600px] lg:max-w-[700px]"
      style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 48 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Missions
        </span>
        <h1 style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--surface-white))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          margin: 0, lineHeight: 1.1,
        }}>
          Complete tasks, earn rewards
        </h1>
      </div>

      {/* ─── Tab bar ─── */}
      <div style={{
        display: "flex", gap: 0, borderRadius: 10, border: "2px solid var(--text-primary)",
        overflow: "hidden", background: "rgba(var(--text-primary-rgb),0.03)",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badgeCount = tab.key === "daily" ? claimableDaily : tab.key === "weekly" ? claimableWeekly : claimableLifetime;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "8px 4px", border: "none", cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
                background: isActive
                  ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
                  : "transparent",
                color: isActive ? "var(--text-primary)" : "rgba(var(--text-primary-rgb),0.4)",
                position: "relative", transition: "all 0.15s",
              }}
            >
              {tab.label}
              {badgeCount > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  padding: "1px 5px", borderRadius: 8, fontSize: 9, fontWeight: 700,
                  background: "var(--accent-hotpink)", color: "var(--surface-white)",
                  lineHeight: 1.3,
                }}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <style>{`@keyframes titleFoil{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>

      {/* ─── Card container ─── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          borderRadius: "14px 14px 8px 8px",
          background: "var(--surface-white, #fff)",
          boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
          border: "2px solid var(--text-primary)",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 8px 6px 12px",
            backgroundImage: "linear-gradient(100deg, var(--accent-hotpink) 0%, var(--accent-purple) 35%, var(--holo-c, #9EE6FF) 65%, var(--accent-hotpink) 100%)",
            backgroundSize: "300% 100%",
            animation: "titleFoil 6s ease-in-out infinite",
            borderBottom: "2px solid var(--text-primary)",
          }}
        >
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.5px", color: "var(--surface-white)",
            textShadow: "0 1px 0 rgba(0,0,0,0.25)", textTransform: "uppercase",
          }}>
            {activeTab === "daily" && `Daily ${dailyClaimed}/${dailyMissions.length} claimed`}
            {activeTab === "weekly" && `Weekly ${weeklyClaimed}/${weeklyMissions.length} claimed`}
            {activeTab === "achievements" && `Achievements ${lifetimeUnlocked}/${lifetimeTotal} unlocked`}
          </span>
          {/* Timer */}
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>
            ⏱ {activeTab === "daily" ? (dailyCountdown ?? "") : activeTab === "weekly" ? (weeklyCountdown ?? "") : ""}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: 12, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {activeTab === "daily" && (
            <>
              {dailyMissions.length === 0
                ? <EmptyState />
                : dailyMissions.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <DifficultyDot difficulty={(m as any).difficulty} />
                      <div style={{ flex: 1 }}>
                        <MissionRow
                          label={m.label}
                          progress={m.progress}
                          target={m.target}
                          reward={m.reward}
                          state={m.claimed ? "claimed" : m.complete ? "claimable" : "in-progress"}
                          onClaim={m.complete && !m.claimed ? () => onClaimDaily(m.id) : undefined}
                        />
                      </div>
                    </div>
                  ))}
              {/* Event missions */}
              {eventMissions.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
                    borderTop: "1px solid rgba(var(--text-primary-rgb),0.06)",
                    paddingTop: 10,
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: "2px",
                      color: "var(--accent-hotpink)", textTransform: "uppercase",
                      fontFamily: "var(--font-sans, monospace)",
                    }}>
                      ✦ Event
                    </span>
                    {eventMissions[0]?.eventEndsAt && (
                      <EventCountdownSmall endsAt={eventMissions[0].eventEndsAt} />
                    )}
                  </div>
                  {eventMissions.map((ev: any) => (
                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <DifficultyDot difficulty={ev.difficulty} />
                      <div style={{ flex: 1 }}>
                        <MissionRow
                          label={ev.label}
                          progress={0}
                          target={ev.target}
                          reward={ev.reward}
                          state="in-progress"
                          onClaim={undefined}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "weekly" && (
            weeklyMissions.length === 0
              ? <EmptyState />
              : weeklyMissions.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <DifficultyDot difficulty={(m as any).difficulty} />
                    <div style={{ flex: 1 }}>
                      <MissionRow
                        key={m.id}
                        label={m.label}
                        progress={m.progress}
                        target={m.target}
                        reward={m.reward}
                        state={m.claimed ? "claimed" : m.complete ? "claimable" : "in-progress"}
                        onClaim={m.complete && !m.claimed ? () => onClaimWeekly(m.id) : undefined}
                      />
                    </div>
                  </div>
                ))
          )}

          {activeTab === "achievements" && (
            lifetimeMissions.length === 0
              ? <EmptyState />
              : lifetimeMissions.map((lm) => {
                  const { def, currentValue, nextTier, nextTierIndex, claimedTierKeys } = lm;
                  const allClaimed = nextTier === null;
                  const lastIdx = claimedTierKeys.length - 1;
                  const lastThreshold = lastIdx >= 0 ? (def.tiers[lastIdx]?.threshold ?? 0) : 0;
                  const nextThreshold = nextTier?.threshold ?? lastThreshold;
                  const claimable = nextTier !== null && currentValue >= nextTier.threshold;

                  return (
                    <MissionRow
                      key={def.id}
                      label={`${def.label}${nextTier ? ` (tier ${(nextTierIndex ?? 0) + 1})` : ""}`}
                      progress={currentValue}
                      target={nextThreshold > 0 ? nextThreshold : 1}
                      reward={nextTier?.reward ?? def.tiers[def.tiers.length - 1].reward}
                      state={allClaimed ? "claimed" : claimable ? "claimable" : nextTierIndex === 0 ? "in-progress" : "locked"}
                      onClaim={claimable ? () => onClaimLifetime(def.id) : undefined}
                    />
                  );
                })
          )}
        </div>
      </div>

      {/* ─── Dots ─── */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                height: 8, border: "none", cursor: "pointer", padding: 0, borderRadius: 4,
                width: isActive ? 24 : 8,
                background: isActive
                  ? "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))"
                  : "rgba(var(--text-primary-rgb),0.12)",
                transition: "all 0.2s",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "24px 16px", textAlign: "center" }}>
      <span style={{ fontSize: 13, color: "rgba(var(--text-primary-rgb),0.3)", fontWeight: 500 }}>
        No missions available
      </span>
    </div>
  );
}

function EventCountdownSmall({ endsAt }: { endsAt: number | string | Date }) {
  const ts = typeof endsAt === "string" ? new Date(endsAt).getTime()
    : endsAt instanceof Date ? endsAt.getTime()
    : endsAt;
  const display = useCountdown(ts);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono, monospace)",
      color: "var(--accent-hotpink)", letterSpacing: "0.5px",
    }}>
      ⏱ {display ?? ""}
    </span>
  );
}

export type { LifetimeMissionState };
