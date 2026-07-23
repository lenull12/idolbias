"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import SideNav from "@/components/SideNav";
import FutPullOverlay from "@/views/FutPullOverlay";
import HomeView from "@/views/HomeView";
import ShopView from "@/views/ShopView";
import CardsView from "@/views/CardsView";
import CharactersView from "@/views/CharactersView";
import CharacterView from "@/views/CharacterView";
import ProfileView from "@/views/ProfileView";
import FAQPage from "@/app/faq/page";
import StreakModal from "@/components/StreakModal";
import RewardToast from "@/components/RewardToast";
import type { Reward } from "@/components/RewardToast";
import AuthStatus from "@/components/AuthStatus";
import WalletPill from "@/components/WalletPill";
import { authClient } from "@/lib/auth/client";
import { IconX } from "@/components/Icons";
import { usePlayer } from "@/lib/usePlayer";
import { claimDailyReward } from "@/lib/gameActions";
import { todayStr, daysBetween } from "@/lib/gameConfig";
import { getCharacters } from "@/data/footballCards";
import type { OwnedCard } from "@/types/ownedCard";

export type TabId = "home" | "shop" | "cards" | "squad" | "transfer" | "characters" | "profile";

export default function AppShell() {
  const { player, loading, refresh } = usePlayer();
  const [view, setView] = useState<TabId | "faq">("home");
  const [pullOpen, setPullOpen] = useState(false);
  const [tickets, setTickets] = useState(0);
  const [gems, setGems] = useState(0);
  const [activePack, setActivePack] = useState("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<"tickets" | "gems">("tickets");
  const [pullCount, setPullCount] = useState<1 | 5>(1);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [gemsTabPending, setGemsTabPending] = useState(false);
  const [toastReward, setToastReward] = useState<Reward | null>(null);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);

  const fetchOwnedCards = useCallback(async () => {
    try {
      const res = await fetch("/api/cards/owned");
      if (!res.ok) return;
      const data = await res.json();
      setOwnedCards(data.cards ?? []);
    } catch {}
  }, []);

  useEffect(() => { fetchOwnedCards(); }, [fetchOwnedCards, player]);

  const handleGemShopNav = () => {
    setGemsTabPending(true);
    setView("shop");
  };

  useEffect(() => {
    if (player) {
      setTickets(player.wallet.tickets);
      setGems(player.wallet.gems);
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

  const profileBadge = canClaimDaily ? 1 : undefined;

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

  const openPull = (packCode: string, method: "tickets" | "gems" = "tickets", count: 1 | 5 = 1) => {
    setActivePack(packCode);
    setPaymentMethod(method);
    setPullCount(count);
    setPullOpen(true);
  };

  const renderView = () => {
    switch (view) {
      case "home":
        return (
          <HomeView
            onGoToShop={() => setView("shop")}
            streak={streak}
            owned={player?.collection}
          />
        );
      case "shop":
        return (
          <ShopView
            tickets={tickets}
            gems={gems}
            onOpenPull={openPull}
            onPurchaseComplete={refresh}
            initialGemsTab={gemsTabPending}
            onGemsTabConsumed={() => setGemsTabPending(false)}
          />
        );
      case "cards":
        return (
          <CardsView
            owned={player?.collection ?? {}}
            ownedCards={ownedCards}
            ownedGrades={{}}
            dust={player?.wallet.dust ?? 0}
            gems={gems}
            onGoToShop={(code) => openPull(code, "tickets", 1)}
            onChanged={refresh}
          />
        );
      case "squad":
        return (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Squad view coming soon
          </div>
        );
      case "transfer":
        return (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
            Transfer market coming soon
          </div>
        );
      case "characters":
        if (selectedCharacter) {
          return (
            <CharacterView
              characterId={selectedCharacter}
              affinityXp={0}
              ownedCards={player?.collection ?? {}}
              onBack={() => setSelectedCharacter(null)}
            />
          );
        }
        return (
          <CharactersView
            affinityXp={{}}
            onSelect={(id) => setSelectedCharacter(id)}
          />
        );
      case "profile":
        return (
          <ProfileView
            tickets={tickets}
            gems={gems}
            dust={player?.wallet.dust ?? 0}
            owned={player?.collection ?? {}}
            streak={streak}
            canClaimDaily={canClaimDaily}
            onClaimDaily={handleClaimDaily}
            collectionCount={Object.values(player?.collection ?? {}).reduce((a, b) => a + b, 0)}
            uniqueCards={Object.keys(player?.collection ?? {}).length}
            createdAt={(player as any)?.createdAt ?? null}
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
      <FutPullOverlay
        packCode={activePack}
        paymentMethod={paymentMethod}
        pullCount={pullCount}
        tickets={tickets}
        gems={gems}
        onClose={() => setPullOpen(false)}
        refresh={refresh}
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
        <TabBar active={view as TabId} onChange={(id) => setView(id)} profileBadge={profileBadge} />
      </div>

      <SideNav active={view as TabId} onChange={(id) => setView(id)} profileBadge={profileBadge} />

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
          }}><IconX size={12} /></button>
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
          <button onClick={() => setView("faq")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: "var(--text-muted)", textDecoration: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
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
