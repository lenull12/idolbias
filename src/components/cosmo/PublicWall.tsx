"use client";

import { useState, useEffect } from "react";

type FeaturedResponse = {
  id: string;
  postId: string;
  replyId: string;
  responseContent: string;
  createdAt: Date | number;
  postContent: string;
  postImageUrl: string | null;
  replyAuthorName: string;
  replyContent: string;
};

export default function PublicWall({ memberId }: { memberId: string }) {
  const [items, setItems] = useState<FeaturedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cosmo/member/${memberId}/public`);
        const data = await res.json();
        setItems(data.featured ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId]);

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: "var(--text-disabled)", fontSize: 13 }}>
        <span style={{ display: "block", fontSize: 28, marginBottom: 8 }}>🏛️</span>
        No featured responses yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item) => (
        <div key={item.id} style={{
          background: "rgba(var(--surface-white-rgb),0.4)",
          borderRadius: 12, border: "1px solid rgba(201,177,255,0.15)",
          padding: 14,
        }}>
          {/* Context quote */}
          <div style={{
            fontSize: 11, color: "var(--text-disabled)", marginBottom: 8,
            fontStyle: "italic",
          }}>
            In the diary post: "{item.postContent.slice(0, 100)}{item.postContent.length > 100 ? "..." : ""}"
          </div>

          {/* Fan reply */}
          <div style={{
            padding: "8px 12px", borderRadius: 8,
            background: "rgba(255,158,196,0.06)",
            marginBottom: 10,
            borderLeft: "2px solid var(--accent-hotpink)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              @{item.replyAuthorName} replied:
            </div>
            <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--text-muted)" }}>
              "{item.replyContent}"
            </span>
          </div>

          {/* Idol response */}
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "linear-gradient(135deg, rgba(255,158,196,0.1), rgba(201,177,255,0.1))",
            border: "1px solid rgba(255,158,196,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                background: "var(--accent-purple)", color: "var(--surface-white)",
              }}>Response</span>
            </div>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>
              {item.responseContent}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
