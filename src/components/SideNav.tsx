"use client";

import Link from "next/link";
import { TABS, ICONS, type TabId } from "@/components/TabBar";

export default function SideNav({
  active,
  onChange,
  missionsBadge,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
  missionsBadge?: number;
}) {
  return (
    <aside
      className="hidden lg:flex"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 208,
        flexDirection: "column",
        gap: 4,
        padding: "28px 14px",
        background: "rgba(var(--surface-white-rgb),0.5)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,158,196,0.08)",
        zIndex: 20,
      }}
    >
      <style>{`
        @keyframes foilDriftV {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .sidenav-logo, .sidenav-item-active-label {
          background-image: linear-gradient(100deg, var(--accent-hotpink) 0%, var(--accent-purple) 30%, var(--holo-c) 55%, var(--accent-pink) 80%, var(--accent-hotpink) 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: foilDriftV 6s ease-in-out infinite;
        }
      `}</style>

      <div style={{ padding: "0 10px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 2 }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            textDecoration: "none",
          }}
          className="sidenav-logo"
        >
          IdolBias
        </Link>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--text-disabled)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span>✦</span> collect your bias <span>✦</span>
        </span>
      </div>

      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              background: isActive ? "rgba(255,158,196,0.08)" : "transparent",
              position: "relative",
              textAlign: "left",
            }}
          >
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  left: -14,
                  top: "20%",
                  bottom: "20%",
                  width: 3,
                  borderRadius: 2,
                  backgroundImage: "linear-gradient(180deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))",
                }}
              />
            )}
            <div style={{ position: "relative" }}>
              <svg
                width="19" height="19" viewBox="0 0 24 24" fill="none"
                stroke={isActive ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.35)"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              >
                {ICONS[tab.id]}
              </svg>
              {tab.id === "missions" && typeof missionsBadge === 'number' && missionsBadge > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -6,
                  padding: "1px 5px", borderRadius: 8, fontSize: 9, fontWeight: 700,
                  background: "var(--accent-hotpink)", color: "var(--surface-white)",
                  lineHeight: 1.3, pointerEvents: "none",
                }}>
                  {missionsBadge > 99 ? "99+" : missionsBadge}
                </span>
              )}
            </div>
            <span
              className={isActive ? "sidenav-item-active-label" : undefined}
              style={{
                fontSize: 15,
                fontWeight: isActive ? 700 : 500,
                fontFamily: "var(--font-sans)",
                color: isActive ? undefined : "var(--text-muted)",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}