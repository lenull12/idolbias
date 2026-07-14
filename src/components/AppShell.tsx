"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TabBar, { type TabId } from "@/components/TabBar";
import SideNav from "@/components/SideNav";
import PullOverlay from "@/views/PullOverlay";
import HomeView from "@/views/HomeView";
import ShopView from "@/views/ShopView";
import CardsView from "@/views/CardsView";
import ArtistsView from "@/views/ArtistsView";
import ProfileView from "@/views/ProfileView";
import WorkshopView from "@/views/WorkshopView";
import MissionsView from "@/views/MissionsView";
import FAQPage from "@/app/faq/page";
import FeedView from "@/components/feed/FeedView";
import CosmoRoomView from "@/components/cosmo/CosmoRoomView";
import IdolProfileView from "@/components/feed/IdolProfileView";
import StreakModal from "@/components/StreakModal";
import RewardToast from "@/components/RewardToast";
import type { Reward } from "@/components/RewardToast";
import AuthStatus from "@/components/AuthStatus";
import WalletPill from "@/components/WalletPill";
import { authClient } from "@/lib/auth/client";
import { usePlayer } from "@/lib/usePlayer";
import {
  claimDailyReward, bumpMissionProgress, claimMissionReward,
  bumpWeeklyMissionProgress, claimWeeklyMissionReward, claimLifetimeTier,
  changeBias,
} from "@/lib/gameActions";
import { LIFETIME_MISSIONS, todayStr, daysBetween } from "@/lib/gameConfig";
import type { MissionDef, MissionState, LifetimeMissionDef, LifetimeTier } from "@/lib/gameConfig";
import type { LifetimeMissionState } from "@/views/MissionsView";
import CARDS, { getCardsByPack } from "@/data/cards";

export default function AppShell() {
  const { player, loading, refresh } = usePlayer();
  const [view, setView] = useState<TabId>("home");
  const [pullOpen, setPullOpen] = useState(false);
  const [tickets, setTickets] = useState(0);
  const [gems, setGems] = useState(0);
  const [bias, setBias] = useState<string | null>(() => player?.progression?.bias ?? null);
  const [biasCooldown, setBiasCooldown] = useState<number | null>(null);
  const [activePack, setActivePack] = useState("LS");
  const [paymentMethod, setPaymentMethod] = useState<"tickets" | "gems">("tickets");
  const [error, setError] = useState<string | null>(null);
  const [cosmoMemberId, setCosmoMemberId] = useState<string | null>(null);
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const [profileGroupId, setProfileGroupId] = useState<string | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [gemsTabPending, setGemsTabPending] = useState(false);
  const [toastReward, setToastReward] = useState<Reward | null>(null);

  const handleGemShopNav = () => {
    setGemsTabPending(true);
    setView("shop");
  };

  useEffect(() => {
    if (player) {
      setTickets(player.wallet.tickets);
      setGems(player.wallet.gems);
      setBias(player.progression.bias);
    }
  }, [player]);

  // Link OAuth account to player on mount (once)
  useEffect(() => {
    authClient.getSession().then((sessionRes) => {
      if (sessionRes?.data?.user) {
        fetch("/api/link-player", { method: "POST", credentials: "include" })
          .then(async (r) => {
            if (r.status === 409) {
              console.warn("Link player: already linked to another account, log out first");
              return;
            }
            if (!r.ok) return;
            const data = await r.json();
            if (data.switched || data.linked) refresh();
          })
          .catch(() => {});
      }
    });
  }, []);

  const prog = player?.progression;
  const streak = prog?.streak ?? 0;
  const canClaimDaily = prog ? prog.lastClaim !== todayStr() : false;
  const gap = prog?.lastClaim ? daysBetween(prog.lastClaim, todayStr()) : null;
  const isBroken = gap !== null && gap > 1 && streak > 0;

  const [dailyTemplates, setDailyTemplates] = useState<MissionDef[]>([]);
  const [weeklyTemplates, setWeeklyTemplates] = useState<MissionDef[]>([]);
  const [eventTemplates, setEventTemplates] = useState<any[]>([]);
  const [dailyResetAt, setDailyResetAt] = useState<number | null>(null);
  const [weeklyResetAt, setWeeklyResetAt] = useState<number | null>(null);

  useEffect(() => {
    if (!player) return;
    fetch("/api/missions/templates", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.daily) setDailyTemplates(data.daily);
        if (data.weekly) setWeeklyTemplates(data.weekly);
        if (data.event) setEventTemplates(data.event);
        if (data.dailyResetAt) setDailyResetAt(data.dailyResetAt);
        if (data.weeklyResetAt) setWeeklyResetAt(data.weeklyResetAt);
      })
      .catch(() => {});
  }, [player]);

  const profileBadge = canClaimDaily ? 1 : undefined;

  // ─── Daily missions ──────────────────────────────────────────────────
  const dailyMissions: MissionState[] = prog && dailyTemplates.length > 0
    ? dailyTemplates.map((m) => {
        const progress = Math.min(prog.missionProgress[m.id] ?? 0, m.target);
        return { ...m, progress, complete: progress >= m.target, claimed: prog.missionsClaimed.includes(m.id) };
      })
    : [];

  // ─── Weekly missions ─────────────────────────────────────────────────
  const weeklyMissions: MissionState[] = prog && weeklyTemplates.length > 0
    ? weeklyTemplates.map((m) => {
        const progress = Math.min(prog.weeklyMissionProgress[m.id] ?? 0, m.target);
        return { ...m, progress, complete: progress >= m.target, claimed: prog.weeklyMissionsClaimed.includes(m.id) };
      })
    : [];

  // ─── Lifetime missions ────────────────────────────────────────────────
  const lifetimeMissions: LifetimeMissionState[] = prog
    ? LIFETIME_MISSIONS.map((def) => {
        let currentValue = 0;
        switch (def.id) {
          case "collect_cards":
            currentValue = Object.keys(player?.collection ?? {}).length;
            break;
          case "complete_sets": {
            const owned = Object.keys(player?.collection ?? {});
            const ownedSet = new Set(owned);
            const packCodes = [...new Set(CARDS.map(c => c.packCode))];
            let completed = 0;
            for (const code of packCodes) {
              const packCards = getCardsByPack(code);
              if (packCards.length > 0 && packCards.every(c => ownedSet.has(c.id))) completed++;
            }
            currentValue = completed;
            break;
          }
          case "collect_legendary":
            currentValue = Object.keys(player?.collection ?? {}).filter(id => id.endsWith("l1") || id.endsWith("l2") || id.endsWith("l3") || id.endsWith("l4") || id.endsWith("l5")).length;
            break;
          case "collect_secret":
            currentValue = Object.keys(player?.collection ?? {}).filter(id => id.endsWith("s1") || id.endsWith("s2") || id.endsWith("s3")).length;
            break;
          case "follow_all_artists":
          case "likes_given":
            currentValue = 0;
            break;
          case "fan_level": {
            const allXp = Object.values(prog.fanXp);
            const totalXp = allXp.reduce((a, b) => a + b, 0);
            currentValue = Math.floor(totalXp / 100) + 1;
            break;
          }
          case "login_dedication":
            currentValue = prog.totalLogins ?? 0;
            break;
          case "streak_record":
            currentValue = prog.streak ?? 0;
            break;
          case "packs_opened":
            currentValue = (prog.missionProgress as any)?.["open_pack"] ?? 0;
            break;
          case "craft_master":
            currentValue = (prog.missionProgress as any)?.["craft_card"] ?? 0;
            break;
          case "disenchant_veteran":
            currentValue = (prog.missionProgress as any)?.["disenchant_card"] ?? 0;
            break;
          case "trades_completed":
            currentValue = 0;
            break;
        }
        const claimedTierKeys: string[] = [];
        let nextTier: LifetimeTier | null = null;
        let nextTierIndex: number | null = null;
        for (let i = 0; i < def.tiers.length; i++) {
          const key = `${def.id}_${i}`;
          if (prog.lifetimeClaimed.includes(key)) {
            claimedTierKeys.push(key);
          } else if (nextTier === null) {
            nextTier = def.tiers[i];
            nextTierIndex = i;
          }
        }
        return { def, currentValue, nextTier, nextTierIndex, claimedTierKeys };
      })
    : [];

  const missionsClaimableCount =
    dailyMissions.filter((m) => m.complete && !m.claimed).length +
    weeklyMissions.filter((m) => m.complete && !m.claimed).length +
    lifetimeMissions.filter((lm) => lm.nextTier !== null && lm.currentValue >= lm.nextTier.threshold).length;

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleClaimDaily = useCallback(async () => {
    try {
      const result = await claimDailyReward();
      setTickets(result.wallet.tickets);
      setGems(result.wallet.gems);
      setToastReward({ tickets: result.tickets, gems: result.gems });
      refresh();
      return { tickets: result.tickets, gems: result.gems, streak: result.streak };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to claim daily reward");
      return null;
    }
  }, [refresh]);

  const handleClaimMission = useCallback(async (id: string) => {
    try {
      const result = await claimMissionReward(id);
      setTickets(result.wallet.tickets);
      setGems(result.wallet.gems);
      refresh();
      const r = (result as any).reward || result;
      setToastReward({ tickets: r.tickets, gems: r.gems, dust: r.dust });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to claim mission reward");
    }
  }, [refresh]);

  const handleClaimWeekly = useCallback(async (id: string) => {
    try {
      const result = await claimWeeklyMissionReward(id);
      setTickets(result.wallet.tickets);
      setGems(result.wallet.gems);
      refresh();
      const r = (result as any).reward || result;
      setToastReward({ tickets: r.tickets, gems: r.gems, dust: r.dust });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to claim weekly mission");
    }
  }, [refresh]);

  const handleClaimLifetime = useCallback(async (id: string) => {
    try {
      const result = await claimLifetimeTier(id);
      setTickets(result.wallet.tickets);
      setGems(result.wallet.gems);
      refresh();
      const r = (result as any).reward || result;
      setToastReward({ tickets: r.tickets, gems: r.gems, dust: r.dust });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to claim achievement");
    }
  }, [refresh]);

  const handleBumpMission = useCallback(async (id: string) => {
    try {
      await bumpMissionProgress(id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update mission");
    }
  }, [refresh]);

  const handleBumpWeekly = useCallback(async (id: string) => {
    try {
      await bumpWeeklyMissionProgress(id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update weekly mission");
    }
  }, [refresh]);

  const handleSetBias = useCallback(async (idol: string) => {
    if (idol === bias) return;
    try {
      const result = await changeBias(idol);
      setBias(result.bias);
      setBiasCooldown(null);
      refresh();
    } catch (e) {
      const msg = (e as Error).message;
      const match = msg.match(/(\d+) day/);
      if (match) setBiasCooldown(parseInt(match[1]));
      setError(msg);
    }
  }, [bias, refresh]);

  const openPull = (packCode: string, method: "tickets" | "gems" = "tickets") => {
    setActivePack(packCode);
    setPaymentMethod(method);
    setPullOpen(true);
  };

  if (profileMemberId && profileGroupId) {
    return (
      <IdolProfileView
        memberId={profileMemberId}
        groupId={profileGroupId}
        playerName={bias ?? "Fan"}
        onBack={() => { setProfileMemberId(null); setProfileGroupId(null); }}
        onBumpMission={handleBumpMission}
        onBumpWeekly={handleBumpWeekly}
      />
    );
  }

  if (cosmoMemberId) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setCosmoMemberId(null)}
          style={{
            position: "absolute", top: 12, left: 14, zIndex: 10,
            padding: "6px 12px", borderRadius: 8, border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
            background: "rgba(var(--surface-white-rgb),0.7)", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          ← Back
        </button>
        <CosmoRoomView playerName={bias ?? "Fan"} />
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case "feed":
        return (
          <FeedView
            playerName={bias ?? "Fan"}
            playerId={player?.playerId}
            onViewProfile={(memberId, groupId) => { setProfileMemberId(memberId); setProfileGroupId(groupId); }}
            onBumpMission={handleBumpMission}
            onBumpWeekly={handleBumpWeekly}
          />
        );
      case "home":
        return (
          <HomeView
            onGoToShop={() => setView("shop")}
            streak={streak}
            owned={player?.collection}
            bias={bias}
          />
        );
      case "shop":
        return (
          <ShopView
            tickets={tickets}
            gems={gems}
            bias={bias}
            onOpenPull={openPull}
            onPurchaseComplete={refresh}
            initialGemsTab={gemsTabPending}
            onGemsTabConsumed={() => setGemsTabPending(false)}
          />
        );
      case "cards":
        return (
          <CardsView
            onView={() => handleBumpMission("view_collection")}
            owned={player?.collection ?? {}}
            onGoToShop={(packCode: string) => { setActivePack(packCode); setView("shop"); }}
            onClaimed={refresh}
          />
        );
      case "workshop":
        return (
          <WorkshopView
            owned={player?.collection ?? {}}
            dust={player?.wallet.dust ?? 0}
            onChanged={refresh}
            onBumpMission={handleBumpMission}
          />
        );
      case "groups":
        return (
          <ArtistsView
            bias={bias}
            onSetBias={handleSetBias}
            onVisitMember={() => { handleBumpMission("view_artist"); handleBumpWeekly("visit_3_artists"); }}
            getFanXp={(idol: string) => prog?.fanXp[idol] ?? 0}
            biasCooldown={biasCooldown}
            onOpenCosmo={(memberId: string) => setCosmoMemberId(memberId)}
          />
        );
      case "profile":
        return (
          <ProfileView
            bias={bias}
            onSetBias={handleSetBias}
            tickets={tickets}
            gems={gems}
            dust={player?.wallet.dust ?? 0}
            owned={player?.collection ?? {}}
            streak={streak}
            canClaimDaily={canClaimDaily}
            onClaimDaily={handleClaimDaily}
            collectionCount={Object.values(player?.collection ?? {}).reduce((a, b) => a + b, 0)}
            uniqueCards={Object.keys(player?.collection ?? {}).length}
            biasCooldown={biasCooldown}
            createdAt={(player as any)?.createdAt ?? null}
          />
        );
      case "missions":
        return (
          <MissionsView
            dailyMissions={dailyMissions}
            weeklyMissions={weeklyMissions}
            lifetimeMissions={lifetimeMissions}
            eventMissions={eventTemplates}
            onClaimDaily={handleClaimMission}
            onClaimWeekly={handleClaimWeekly}
            onClaimLifetime={handleClaimLifetime}
            dailyResetAt={dailyResetAt}
            weeklyResetAt={weeklyResetAt}
          />
        );
      case "faq":
        return <FAQPage />;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", gap: 16, background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-end) 50%, var(--bg) 100%)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(var(--text-primary-rgb),0.08)",
          borderTopColor: "var(--accent-hotpink)", animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 16, color: "var(--text-muted)" }}>
          Loading...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pullOpen) {
    return (
      <PullOverlay
        packCode={activePack}
        bias={bias}
        tickets={tickets}
        gems={gems}
        paymentMethod={paymentMethod}
        onClose={() => setPullOpen(false)}
        onPackOpened={() => { refresh(); }}
        onCardRevealed={() => {}}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-end) 50%, var(--bg) 100%)",
        color: "var(--text-primary)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div className="lg:hidden">
        <TabBar active={view} onChange={setView} missionsBadge={missionsClaimableCount} profileBadge={profileBadge} />
      </div>

      <SideNav active={view} onChange={setView} missionsBadge={missionsClaimableCount} profileBadge={profileBadge} />

      {error && (
        <div style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 999,
          padding: "10px 20px", borderRadius: 10, background: "var(--text-primary)", color: "var(--surface-white)",
          fontSize: 13, fontWeight: 600, maxWidth: "90vw", textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          <span style={{ marginRight: 8 }}>⚠️</span>{error}
          <button onClick={() => setError(null)} style={{
            marginLeft: 12, background: "none", border: "none", color: "var(--accent-pink)",
            cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>✕</button>
        </div>
      )}

      {toastReward && <RewardToast reward={toastReward} onDone={() => setToastReward(null)} />}

      <main className="lg:pl-[208px]" style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "12px 16px 0" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <WalletPill icon="🎟️" value={tickets} tone="pink" />
            <WalletPill icon="💎" value={gems} tone="cyan" onIncrement={handleGemShopNav} />
          </div>
          <AuthStatus />
        </div>
        {renderView()}
        <div style={{ padding: "24px 16px 48px", textAlign: "center", fontSize: 11, color: "var(--text-disabled)" }}>
          <span style={{ opacity: 0.5 }}>© {new Date().getFullYear()} IdolBias.</span>{' '}
          <Link href="/legal/notices" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Legal Notice</Link>
          <span style={{ opacity: 0.3, margin: "0 6px" }}>·</span>
          <Link href="/legal/privacy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy</Link>
          <span style={{ opacity: 0.3, margin: "0 6px" }}>·</span>
          <Link href="/legal/terms" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms</Link>
          <span style={{ opacity: 0.3, margin: "0 6px" }}>·</span>
          <button onClick={() => setView("faq")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: "var(--text-muted)", textDecoration: "none", fontFamily: "inherit" }}>
            FAQ
          </button>
        </div>
      </main>

      {showStreak && (
        <StreakModal
          streak={streak}
          canClaim={canClaimDaily}
          isBroken={isBroken}
          onClaim={handleClaimDaily}
          onClose={() => setShowStreak(false)}
        />
      )}
    </div>
  );
}
