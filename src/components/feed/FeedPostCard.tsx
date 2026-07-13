"use client";

import { useState } from "react";
import { getMember, getGroup } from "@/data/artists";

type Comment = {
  id: string;
  postId: string;
  userId: string | null;
  authorName: string;
  content: string;
  isOfficial: boolean;
  createdAt: Date | number | string;
};

type FeedPost = {
  id: string;
  memberId: string;
  groupId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date | number | string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSubscribed: boolean;
  previewComments: Comment[];
};

export default function FeedPostCard({
  post,
  onLike,
  onComment,
  onToggleSubscribe,
  onViewProfile,
  onViewAllComments,
  playerName,
}: {
  post: FeedPost;
  onLike: () => void;
  onComment: (text: string) => void;
  onToggleSubscribe: () => void;
  onViewProfile: () => void;
  onViewAllComments: () => void;
  playerName: string;
}) {
  const member = getMember(post.groupId, post.memberId);
  const group = getGroup(post.groupId);
  const displayName = member?.stageName ?? post.memberId;
  const groupName = group?.name ?? post.groupId;
  const avatar = member?.profileImage;

  const [commentText, setCommentText] = useState("");

  const timeAgo = getTimeAgo(post.createdAt);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment(commentText.trim());
    setCommentText("");
  };

  return (
    <div
      style={{
        background: "rgba(var(--surface-white-rgb),0.5)",
        borderRadius: 14,
        border: "1px solid rgba(255,158,196,0.1)",
        overflow: "hidden",
      }}
    >
      {/* Header — avatar + name clickable */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <div
          onClick={onViewProfile}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}
        >
          {avatar && (
            <img
              src={avatar}
              alt={displayName}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${member?.color ?? "var(--text-muted)"}` }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</span>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                background: "var(--accent-hotpink)", color: "var(--surface-white)",
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>Official</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>
              {groupName} · {timeAgo}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSubscribe(); }}
          style={{
            padding: "4px 10px", borderRadius: 6, border: "1px solid",
            borderColor: post.isSubscribed ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.15)",
            background: post.isSubscribed ? "var(--accent-hotpink)" : "transparent",
            color: post.isSubscribed ? "var(--surface-white)" : "var(--text-muted)",
            fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
          }}
        >
          {post.isSubscribed ? "Following" : "Follow"}
        </button>
      </div>

      {/* Image — natural ratio preserved */}
      <div style={{ width: "100%", background: "var(--bg)", display: "flex" }}>
        <img
          src={post.imageUrl}
          alt={post.caption ?? "Feed post"}
          style={{ width: "100%", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Actions — heart only, no count */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 14px 6px" }}>
        <button
          onClick={onLike}
          style={{
            display: "flex", alignItems: "center",
            background: "none", border: "none", cursor: "pointer",
            color: post.isLiked ? "var(--accent-hotpink)" : "var(--text-muted)",
            fontSize: 13, fontWeight: 600, padding: 0,
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
        <div style={{ padding: "4px 14px" }}>
          <span style={{ fontSize: 13, lineHeight: 1.4 }}>
            <strong>{displayName}</strong> {post.caption}
          </span>
        </div>
      )}

      {/* Preview comments */}
      {post.previewComments.length > 0 && (
        <div style={{ padding: "4px 14px 0" }}>
          {post.previewComments.map((c) => (
            <div key={c.id} style={{ fontSize: 13, lineHeight: 1.6 }}>
              <strong>{c.authorName}</strong>{" "}{c.content}
            </div>
          ))}
        </div>
      )}

      {/* View all comments link (clickable) */}
      {post.commentCount > 2 && (
        <div style={{ padding: "2px 14px" }}>
          <span
            onClick={onViewAllComments}
            style={{ fontSize: 13, color: "var(--text-disabled)", cursor: "pointer" }}
          >
            View all {post.commentCount} comments
          </span>
        </div>
      )}

      {/* Comment input */}
      <div style={{ display: "flex", gap: 8, padding: "8px 14px 10px", borderTop: "1px solid rgba(255,158,196,0.06)", marginTop: 6 }}>
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
          placeholder={`Comment as ${playerName}...`}
          style={{
            flex: 1, padding: "6px 0", border: "none", background: "transparent",
            fontSize: 13, outline: "none", color: "var(--text-primary)",
          }}
        />
        <button
          onClick={handleSubmitComment}
          disabled={!commentText.trim()}
          style={{
            border: "none", background: "none", padding: 0,
            color: commentText.trim() ? "var(--accent-hotpink)" : "var(--text-disabled)",
            fontWeight: 700, fontSize: 13, cursor: commentText.trim() ? "pointer" : "default",
          }}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date | number | string): string {
  const now = Date.now();
  const ts = typeof date === "number" ? date : new Date(date).getTime();
  if (isNaN(ts)) return "recently";
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
