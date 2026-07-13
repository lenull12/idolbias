"use client";

export default function SystemWindow({
  title,
  onClose,
  children,
  width = 320,
}: {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  width?: number | string;
}) {
  return (
    <div
      style={{
        width,
        maxWidth: "90vw",
        borderRadius: "14px 14px 8px 8px",
        background: "var(--surface-white, #fff)",
        boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
        border: "2px solid var(--text-primary)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes titleFoil {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px 6px 12px",
          backgroundImage:
            "linear-gradient(100deg, var(--accent-hotpink) 0%, var(--accent-purple) 35%, var(--holo-c, #9EE6FF) 65%, var(--accent-hotpink) 100%)",
          backgroundSize: "300% 100%",
          animation: "titleFoil 6s ease-in-out infinite",
          borderBottom: "2px solid var(--text-primary)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.5px",
            color: "var(--surface-white)",
            textShadow: "0 1px 0 rgba(0,0,0,0.25)",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>

        <div style={{ display: "flex", gap: 5 }}>
          <span style={dot("rgba(var(--surface-white-rgb),0.5)")} />
          <span style={dot("rgba(var(--surface-white-rgb),0.5)")} />
          <span
            onClick={onClose}
            style={{
              ...dot("var(--surface-white)"),
              cursor: onClose ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--accent-hotpink)",
              lineHeight: 1,
            }}
          >
            {onClose ? "×" : ""}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function dot(color: string): React.CSSProperties {
  return {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: color,
    border: "1.5px solid var(--text-primary)",
  };
}