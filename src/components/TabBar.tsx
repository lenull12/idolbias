"use client";

import Image from "next/image";

import type { TabId } from "@/components/AppShell";

export const ICONS: Record<TabId, React.ReactNode> = {
  home: (
    <path d="M3 10.5 12 4l9 6.5M5.5 9.5V19a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5h3.5a1 1 0 0 0 1-1V9.5" />
  ),
  shop: (
    <path d="M4 8.5 5.5 4h13L20 8.5M4 8.5v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-10M4 8.5h16M9 12.5a3 3 0 0 0 6 0" />
  ),
  cards: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  squad: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  transfer: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 6h18" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 18H3" />
    </>
  ),
  characters: (
    <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c1.3-3.7 4.2-5.5 7.5-5.5s6.2 1.8 7.5 5.5" />
  ),
  profile: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
};

export const TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
  { id: "cards", label: "Cards" },
  { id: "squad", label: "Squad" },
  { id: "transfer", label: "Transfer" },
  { id: "characters", label: "Players" },
  { id: "profile", label: "Profile" },
];

export default function TabBar({
  active,
  onChange,
  profileBadge,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
  profileBadge?: number;
}) {
  return (
    <nav
      style={{
        display: "flex",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        background: "rgba(var(--surface-white-rgb),0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "4px 8px",
        paddingBottom: "calc(4px + env(safe-area-inset-bottom, 0px))",
        gap: 2,
        userSelect: "none",
        WebkitUserSelect: "none",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
      className="no-scrollbar"
    >
      <style>{`
        @keyframes foilDrift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .tabbar-hairline {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            var(--accent-pink) 20%,
            var(--accent-purple) 40%,
            var(--holo-c, #9EE6FF) 60%,
            var(--accent-pink) 80%,
            transparent 100%);
          background-size: 300% 100%;
          animation: foilDrift 8s ease-in-out infinite;
          opacity: 0.5;
        }
        .tab-label-active {
          background-image: linear-gradient(100deg,
            var(--accent-hotpink) 0%,
            var(--accent-purple) 30%,
            var(--holo-c, #9EE6FF) 55%,
            var(--accent-pink) 80%,
            var(--accent-hotpink) 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: foilDrift 5s ease-in-out infinite;
        }
        .tab-indicator {
          height: 2px;
          border-radius: 2px;
          background-image: linear-gradient(90deg,
            var(--accent-hotpink), var(--accent-purple), var(--holo-c, #9EE6FF), var(--accent-hotpink));
          background-size: 300% 100%;
          animation: foilDrift 3s ease-in-out infinite;
        }
      `}</style>

      <div className="tabbar-hairline" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          minWidth: 36,
          height: 40,
          marginRight: 4,
          flexShrink: 0,
        }}
      >
        <Image
          src="/logo-mark.svg"
          alt="IdolBias"
          width={24}
          height={30}
          priority
        />
      </div>

      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 8px 6px",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              fontSize: 13,
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.5px",
              borderRadius: 10,
              transition: "all 0.15s",
              outline: "none",
            }}
          >
            <div style={{ position: "relative" }}>
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isActive ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.3)"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "stroke 0.15s" }}
              >
                {ICONS[tab.id]}
              </svg>
              {tab.id === "profile" && typeof profileBadge === 'number' && profileBadge > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -6,
                  padding: "1px 5px", borderRadius: 8, fontSize: 9, fontWeight: 700,
                  background: "var(--accent-hotpink)", color: "var(--surface-white)",
                  lineHeight: 1.3, pointerEvents: "none",
                }}>
                  {profileBadge > 99 ? "99+" : profileBadge}
                </span>
              )}
            </div>
            <span className={isActive ? "tab-label-active" : undefined} style={!isActive ? { color: "var(--text-secondary)" } : undefined}>
              {tab.label}
            </span>
            {isActive && <div className="tab-indicator" style={{ width: 16, marginTop: 1 }} />}
          </button>
        );
      })}
    </nav>
  );
}

export type { TabId };
