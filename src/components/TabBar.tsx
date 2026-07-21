"use client";

import Image from "next/image";

type TabId = "home" | "feed" | "shop" | "market" | "cards" | "characters" | "profile" | "missions" | "faq";

export const ICONS: Record<TabId, React.ReactNode> = {
  home: (
    <path d="M3 10.5 12 4l9 6.5M5.5 9.5V19a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5h3.5a1 1 0 0 0 1-1V9.5" />
  ),
  feed: (
    <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM8 12h8M12 8v8" />
  ),
  shop: (
    <path d="M4 8.5 5.5 4h13L20 8.5M4 8.5v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-10M4 8.5h16M9 12.5a3 3 0 0 0 6 0" />
  ),
  market: (
    <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6M14 7h4v4" />
  ),
  cards: (
    <>
      <rect x="7.5" y="3.5" width="11" height="15" rx="1.6" transform="rotate(8 13 11)" opacity="0.35" />
      <rect x="5" y="5" width="14" height="15" rx="1.6" />
    </>
  ),
  characters: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  profile: (
    <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c1.3-3.7 4.2-5.5 7.5-5.5s6.2 1.8 7.5 5.5" />
  ),
  missions: (
    <path d="M9 5.5H7a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 17 5.5h-2M9 5.5a1.5 1.5 0 0 0 1.5 1.5h3A1.5 1.5 0 0 0 15 5.5M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M9 10.5l2 2 4-4" />
  ),
  faq: (
    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v0M12 12a3 3 0 0 0 2.1-5.1A3 3 0 0 0 9 9" />
  ),
};

export const TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "feed", label: "Feed" },
  { id: "shop", label: "Shop" },
  { id: "market", label: "Market" },
  { id: "cards", label: "Cards" },
  { id: "characters", label: "Characters" },
  { id: "profile", label: "Profile" },
  { id: "missions", label: "Missions" },
  { id: "faq", label: "FAQ" },
];

export default function TabBar({
  active,
  onChange,
  missionsBadge,
  profileBadge,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
  missionsBadge?: number;
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
