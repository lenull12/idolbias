"use client";

export default function PillBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  badges,
}: {
  tabs: { key: T; label: string }[];
  activeTab: T;
  onTabChange: (key: T) => void;
  badges?: Partial<Record<T, number>>;
}) {
  return (
    <div style={{
      display: "flex", gap: 0, borderRadius: 10,
      border: "2px solid var(--text-primary)",
      overflow: "hidden",
      background: "rgba(var(--text-primary-rgb),0.03)",
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const badge = badges?.[tab.key] ?? 0;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
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
            {badge > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                padding: "1px 5px", borderRadius: 8, fontSize: 9, fontWeight: 700,
                background: "var(--accent-hotpink)", color: "var(--surface-white)",
                lineHeight: 1.3,
              }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
