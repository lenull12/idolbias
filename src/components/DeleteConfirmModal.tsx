"use client";

import { useState } from "react";

export default function DeleteConfirmModal({ onClose }: { onClose: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        setDone(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert("Delete failed.");
        onClose();
      }
    } catch {
      alert("Delete failed.");
      onClose();
    }
    setDeleting(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(var(--text-primary-rgb),0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        cursor: "pointer",
      }}
    >
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
          width: "min(320px, 88vw)",
          borderRadius: 16, overflow: "hidden",
          border: "2px solid var(--text-primary)",
          boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
          background: "var(--surface-white)",
          cursor: "default",
        }}
      >
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
          {done ? (
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent-hotpink)", fontFamily: "var(--font-display, cursive)" }}>
              ✓ Account deleted
            </div>
          ) : (
            <>
              <div style={{ fontSize: 28 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Delete your account?
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                All your data will be permanently removed. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onClose}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
                    background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                    fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                    background: deleting ? "rgba(255,80,80,0.1)" : "#ff5050",
                    color: deleting ? "rgba(255,80,80,0.5)" : "#fff",
                    cursor: deleting ? "default" : "pointer",
                    fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
