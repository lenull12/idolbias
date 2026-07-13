"use client";

import { useState, useEffect } from "react";

type Comment = {
  id: string;
  postId: string;
  userId: string | null;
  authorName: string;
  content: string;
  isOfficial: boolean;
  createdAt: Date | number | string;
};

type PostDetail = {
  id: string;
  memberId: string;
  groupId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date | number | string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
};

export default function PostDetailModal({
  post,
  playerName,
  onClose,
  onLike,
}: {
  post: PostDetail;
  playerName: string;
  onClose: () => void;
  onLike: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/feed/${post.id}/comments`);
        const data = await res.json();
        setComments(data.comments ?? []);
      } catch { /* ignore */ }
    })();
  }, [post.id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/feed/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: playerName, content: text.trim() }),
      });
      if (res.ok) {
        setText("");
        const refresh = await fetch(`/api/feed/${post.id}/comments`);
        const data = await refresh.json();
        setComments(data.comments ?? []);
      }
    } catch { /* ignore */ }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          background: "rgba(var(--surface-white-rgb),0.95)",
          borderRadius: 14,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            {post.memberId}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Image — capped so comments stay visible */}
        <div style={{ width: "100%", background: "var(--bg)", display: "flex", flexShrink: 0 }}>
          <img
            src={post.imageUrl}
            alt=""
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* Actions — heart only */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px 4px" }}>
          <button
            onClick={onLike}
            style={{
              display: "flex", alignItems: "center",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              color: post.isLiked ? "var(--accent-hotpink)" : "var(--text-muted)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={post.isLiked ? "var(--accent-hotpink)" : "none"}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div style={{ padding: "4px 14px", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
            <strong>{post.memberId}</strong> {post.caption}
          </div>
        )}

        {/* Comments — preview 2-3 + toggle all */}
        <div style={{ padding: "4px 14px 0" }}>
          {comments.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-disabled)", padding: "8px 0" }}>No comments yet</div>
          ) : (
            <>
              {(showAllComments ? comments : comments.slice(0, 3)).map((c) => (
                <div key={c.id} style={{ padding: "4px 0", fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>
                  <strong>{c.authorName}</strong>{" "}{c.content}
                </div>
              ))}
              {comments.length > 3 && (
                <div style={{ padding: "4px 0" }}>
                  <span
                    onClick={() => setShowAllComments(!showAllComments)}
                    style={{ fontSize: 13, color: "var(--text-disabled)", cursor: "pointer" }}
                  >
                    {showAllComments ? "Show less" : `View all ${comments.length} comments`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div style={{
          display: "flex", gap: 8, padding: "8px 14px 10px",
          borderTop: "1px solid rgba(0,0,0,0.04)",
        }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Write a comment..."
            style={{
              flex: 1, padding: "6px 0", border: "none", background: "transparent",
              fontSize: 13, outline: "none", color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            style={{
              border: "none", background: "none", padding: 0,
              color: text.trim() ? "var(--accent-hotpink)" : "var(--text-disabled)",
              fontWeight: 700, fontSize: 13, cursor: text.trim() ? "pointer" : "default",
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
