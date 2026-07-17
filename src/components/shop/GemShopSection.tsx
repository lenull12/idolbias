"use client";

import { useState, useCallback, useMemo } from "react";
import GemPackageCard from "./GemPackageCard";
import { GEM_PACKAGES } from "@/lib/gemShop";
import type { GemPackage } from "@/lib/gemShop";
import CloseButton from "@/components/CloseButton";

export default function GemShopSection({
  gems, onPurchaseComplete,
}: {
  gems: number;
  onPurchaseComplete?: () => void;
}) {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [pendingPkg, setPendingPkg] = useState<GemPackage | null>(null);
  const [guestError, setGuestError] = useState(false);

  const bestValueId = useMemo(() => {
    let best = GEM_PACKAGES[0]?.id ?? "";
    let bestRatio = 0;
    for (const p of GEM_PACKAGES) {
      const ratio = p.gems / (p.amountEur / 100);
      if (ratio > bestRatio) { bestRatio = ratio; best = p.id; }
    }
    return best;
  }, []);

  const sortedPkgs = useMemo(() => {
    return [...GEM_PACKAGES].sort((a, b) => a.gems - b.gems);
  }, []);

  const handleBuyClick = useCallback((pkg: GemPackage) => {
    setPendingPkg(pkg);
  }, []);

  const handleConfirmWaiver = useCallback(async () => {
    if (!pendingPkg) return;
    const pkg = pendingPkg;
    setPendingPkg(null);
    setBuyingId(pkg.id);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, waiverConfirmed: true }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const err = await res.json();
        if (err.error === "guest") {
          setGuestError(true);
        } else {
          console.error("Checkout error:", err);
        }
        setBuyingId(null);
      }
    } catch (err) {
      console.error("Checkout network error:", err);
      setBuyingId(null);
    }
  }, [pendingPkg]);

  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("purchase");
    if (result === "success") {
      onPurchaseComplete?.();
      window.history.replaceState({}, "", window.location.pathname);
    }
  });

  const getBadge = (pkg: GemPackage): string | undefined => {
    if (pkg.id === bestValueId) return "BEST VALUE";
    if (pkg.featured) return "POPULAR";
    return undefined;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Description */}
      <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Choose a pack and top up your wallet. Larger purchases include bonus gems.
      </span>

      {/* Balance card */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderRadius: 12,
        background: "linear-gradient(135deg, rgba(255,20,147,0.06), rgba(201,177,255,0.06))",
        border: "2px solid rgba(var(--text-primary-rgb),0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>💎</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              Your balance
            </span>
            <span style={{
              fontSize: 22, fontWeight: 900, fontFamily: "var(--font-display)",
              color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1,
            }}>
              {gems.toLocaleString()} Gems
            </span>
          </div>
        </div>
      </div>

      {/* Package list */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
      }}>
        {sortedPkgs.map((pkg, i) => (
          <GemPackageCard
            key={pkg.id}
            pkg={pkg}
            gemIndex={i + 1}
            badge={getBadge(pkg)}
            onBuy={() => handleBuyClick(pkg)}
            loading={buyingId === pkg.id}
          />
        ))}
      </div>

      {/* Stripe trust bar */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "center",
        padding: "6px 14px", borderRadius: 8,
        border: "2px solid rgba(var(--text-primary-rgb),0.08)",
        background: "rgba(var(--text-primary-rgb),0.03)",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.3px" }}>
          Secured by Stripe · Visa · Mastercard · Apple Pay
        </span>
      </div>

      {/* Guest account required modal */}
      {guestError && (
        <div onClick={() => setGuestError(false)} style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 380, background: "rgba(var(--surface-white-rgb),0.95)",
            borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              Account required
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)", margin: 0 }}>
              You need to sign in or create an account before purchasing gems. This ensures your gems are saved and linked to your profile.
            </p>
            <a href="/login" style={{
              display: "block", textAlign: "center", padding: "12px 0", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
              color: "var(--surface-white)", fontWeight: 700, fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-display)", textDecoration: "none", letterSpacing: "0.5px",
            }}>
              Sign in / Create account
            </a>
            <CloseButton onClick={() => setGuestError(false)} label="Maybe later" />
          </div>
        </div>
      )}

      {/* Waiver modal */}
      {pendingPkg && (
        <div onClick={() => setPendingPkg(null)} style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 400,
            background: "rgba(var(--surface-white-rgb),0.95)",
            borderRadius: 16, padding: 24,
            display: "flex", flexDirection: "column", gap: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              Confirm purchase
            </h3>

            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 8px" }}>
                You are about to purchase <strong>{pendingPkg.gems.toLocaleString()} Gems</strong> for <strong>{(pendingPkg.amountEur / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>.
              </p>
              <p style={{ margin: 0 }}>
                By confirming, you agree that delivery of the digital content (Gems) will begin <strong>immediately</strong> upon payment, and you <strong>expressly waive your 14-day right of withdrawal</strong>. This purchase is <strong>final and non-refundable</strong>.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPendingPkg(null)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8,
                  border: "2px solid rgba(var(--text-primary-rgb),0.12)",
                  background: "transparent", color: "var(--text-primary)",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-display)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWaiver}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                  color: "var(--surface-white)", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-display)",
                }}
              >
                Confirm & pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
