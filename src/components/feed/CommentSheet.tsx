"use client";

import { useState, useEffect } from "react";

type Comment = {
  id: string;
  postId: string;
  userId: string | null;
  authorName: string;
  content: string;
  isOfficial: boolean;
  createdAt: Date | number;
};

export default function CommentSheet({
  postId,
  playerName,
  onClose,
}: {
  postId: string;
  playerName: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/feed/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: playerName, content: text.trim() }),
      });
      if (res.ok) {
        setText("");
        fetchComments();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      background: "rgba(0,0,0,0.5)",
    }}>
      <div style={{ flex: 1 }} onClick={onClose} />
      <div style={{
        background: "var(--surface-white)", borderTopLeftRadius: 16, borderTopRightRadius: 16,
        maxHeight: "70vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Comments</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-disabled)", fontSize: 13 }}>No comments yet</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.authorName}</span>
                  {c.isOfficial && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
                      background: "var(--accent-hotpink)", color: "var(--surface-white)",
                    }}>Official</span>
                  )}
                </div>
                <span style={{ fontSize: 13, lineHeight: 1.4, color: "var(--text-primary)" }}>{c.content}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Write a comment..."
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 13, outline: "none", background: "rgba(0,0,0,0.02)",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: text.trim() ? "var(--accent-hotpink)" : "rgba(0,0,0,0.05)",
              color: text.trim() ? "var(--surface-white)" : "var(--text-disabled)",
              fontWeight: 600, fontSize: 13, cursor: text.trim() ? "pointer" : "default",
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
