"use client";

import { useState, useEffect } from "react";

type Reply = {
  id: string;
  postId: string;
  content: string;
  createdAt: Date | number;
  isFeatured: boolean;
};

export default function PrivateThread({
  postId,
  memberId,
  playerName,
}: {
  postId: string;
  memberId: string;
  playerName: string;
}) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReplies = async () => {
    try {
      const res = await fetch(`/api/cosmo/member/${memberId}/my-thread/${postId}`);
      const data = await res.json();
      setReplies(data.replies ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReplies(); }, [postId, memberId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/cosmo/post/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: playerName, content: text.trim() }),
      });
      if (res.ok) {
        setText("");
        fetchReplies();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
        ) : replies.length === 0 ? (
          <div style={{
            padding: 20, textAlign: "center", color: "var(--text-disabled)", fontSize: 13,
            background: "rgba(255,255,255,0.03)", borderRadius: 10,
          }}>
            <span style={{ display: "block", fontSize: 24, marginBottom: 6 }}>💌</span>
            No replies yet. Write something to your idol.
          </div>
        ) : (
          replies.map((r) => (
            <div
              key={r.id}
              style={{
                alignSelf: "flex-end", maxWidth: "85%",
                padding: "10px 14px", borderRadius: "14px 14px 4px 14px",
                background: "rgba(255,158,196,0.12)",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{r.content}</span>
              {r.isFeatured && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, marginTop: 6,
                  fontSize: 10, fontWeight: 700, color: "var(--accent-gold)",
                }}>
                  <span>✦ Featured</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send a private message..."
          style={{
             flex: 1, padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(255,158,196,0.15)",
            fontSize: 13, outline: "none", background: "rgba(255,255,255,0.03)",
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            padding: "10px 16px", borderRadius: 10, border: "none",
            background: text.trim() ? "var(--accent-hotpink)" : "rgba(255,255,255,0.05)",
            color: text.trim() ? "var(--surface-white)" : "var(--text-disabled)",
            fontWeight: 600, fontSize: 13, cursor: text.trim() ? "pointer" : "default",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
