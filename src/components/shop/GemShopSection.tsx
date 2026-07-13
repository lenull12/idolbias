"use client";

import { useState, useCallback, useMemo } from "react";
import GemPackageCard from "./GemPackageCard";
import { GEM_PACKAGES } from "@/lib/gemShop";
import type { GemPackage } from "@/lib/gemShop";

export default function GemShopSection({ onPurchaseComplete }: { onPurchaseComplete?: () => void }) {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [pendingPkg, setPendingPkg] = useState<GemPackage | null>(null);

  const bestValueId = useMemo(() => {
    let best = GEM_PACKAGES[0]?.id ?? "";
    let bestRatio = 0;
    for (const p of GEM_PACKAGES) {
      const ratio = p.gems / (p.amountEur / 100);
      if (ratio > bestRatio) { bestRatio = ratio; best = p.id; }
    }
    return best;
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
        console.error("Checkout error:", err);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, letterSpacing: "2px",
          color: "rgba(var(--text-primary-rgb),0.35)", textTransform: "uppercase",
        }}>
          ✦ Get Gems
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
          Buy gems to unlock premium packs and perks. Bonus on larger purchases.
        </span>
      </div>

      {/* Package list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GEM_PACKAGES.map((pkg) => (
          <GemPackageCard
            key={pkg.id}
            pkg={pkg}
            onBuy={() => handleBuyClick(pkg)}
            loading={buyingId === pkg.id}
            bestValue={pkg.id === bestValueId}
          />
        ))}
      </div>

      {/* Stripe trust bar */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "center",
        padding: "6px 14px", borderRadius: 8,
        border: "1.5px solid rgba(99,91,255,0.2)",
        background: "rgba(99,91,255,0.08)",
      }}>
        <span style={{ fontSize: 11, color: "#635BFF" }}>🔒</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#635BFF", fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.3px" }}>
          Secured by Stripe · Visa · Mastercard · Apple Pay
        </span>
      </div>

      {/* Waiver modal */}
      {pendingPkg && (
        <div
          onClick={() => setPendingPkg(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 400,
              background: "rgba(var(--surface-white-rgb),0.95)",
              borderRadius: 16,
              padding: 24,
              display: "flex", flexDirection: "column", gap: 16,
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
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
                  border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
                  background: "transparent", color: "var(--text-primary)",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
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
