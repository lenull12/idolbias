"use client";

import { useState, useEffect } from "react";
import PostDetailModal from "./PostDetailModal";

type ProfileData = {
  member: {
    id: string;
    stageName: string;
    realName?: string;
    groupName: string;
    groupId: string;
    position: string;
    avatar: string | null;
    color: string;
    bio: string;
    birthday?: string;
  };
  followerCount: number;
  postCount: number;
  isFollowedByMe: boolean;
  posts: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: Date | number | string;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
  }>;
};

export default function IdolProfileView({
  memberId,
  groupId,
  playerName,
  onBack,
  onBumpMission,
  onBumpWeekly,
}: {
  memberId: string;
  groupId: string;
  playerName: string;
  onBack: () => void;
  onBumpMission?: (id: string) => void;
  onBumpWeekly?: (id: string) => void;
}) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/feed/profile/${memberId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [memberId]);

  const handleToggleFollow = async () => {
    if (!data) return;
    const currently = data.isFollowedByMe;
    setData((prev) => prev ? { ...prev, isFollowedByMe: !currently } : prev);
    try {
      const endpoint = currently ? "/api/feed/unsubscribe" : "/api/feed/subscribe";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, groupId }),
      });
      if (res.ok && !currently) { onBumpMission?.("follow_artist"); onBumpWeekly?.("follow_5_artists"); }
    } catch {
      setData((prev) => prev ? { ...prev, isFollowedByMe: currently } : prev);
    }
  };

  const handleLike = async (postId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p
        ),
      };
    });
    try {
      await fetch(`/api/feed/${postId}/like`, { method: "POST" });
    } catch {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p
          ),
        };
      });
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px", textAlign: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "var(--accent-hotpink)", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent-hotpink)", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>← Back</button>
        <div style={{ color: "var(--text-disabled)", fontSize: 13 }}>Profile not found</div>
      </div>
    );
  }

  const { member, postCount, isFollowedByMe, posts } = data;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 0 24px" }}>
      <div style={{ padding: "12px 16px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent-hotpink)", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back
        </button>
      </div>

      {/* Profile header */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", padding: "0 16px 20px" }}>
        {member.avatar && (
          <div style={{
            width: 96, height: 96, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            border: `3px solid ${member.color}`,
            boxShadow: `0 0 20px ${member.color}33`,
          }}>
            <img
              src={member.avatar}
              alt={member.stageName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            {member.stageName}
          </h2>
          <div style={{ fontSize: 13, color: member.color, fontWeight: 600, marginTop: 2 }}>
            {member.position} · {member.groupName}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            <strong>{postCount}</strong> posts
          </div>
        </div>
        <button
          onClick={handleToggleFollow}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
            background: isFollowedByMe ? "var(--accent-hotpink)" : "rgba(var(--surface-white-rgb),0.7)",
            color: isFollowedByMe ? "var(--surface-white)" : "var(--text-primary)",
            fontWeight: 700, fontSize: 13,
            outline: isFollowedByMe ? "none" : "1.5px solid rgba(var(--text-primary-rgb),0.12)",
            outlineOffset: -2,
          }}
        >
          {isFollowedByMe ? "Following" : "Follow"}
        </button>
      </div>

      {/* Bio */}
      <div style={{ padding: "0 16px 16px" }}>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(var(--text-primary-rgb),0.7)", margin: 0 }}>
          {member.bio}
        </p>
      </div>

      {/* Section divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,158,196,0.15), transparent)", margin: "0 16px 14px" }} />

      {/* Post grid */}
      <div style={{ padding: "0 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--text-disabled)", textTransform: "uppercase", marginBottom: 10, paddingLeft: 6 }}>
          ✦ Posts
        </div>
        {posts.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-disabled)", fontSize: 13 }}>
            No posts yet
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4,
          }}>
            {posts.map((p) => (
              <div
                key={p.id}
                onClick={() => setDetailPostId(p.id)}
                style={{
                  aspectRatio: "1/1", cursor: "pointer", overflow: "hidden",
                  borderRadius: 8,
                  border: "1px solid rgba(255,158,196,0.06)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <img
                  src={p.imageUrl}
                  alt={p.caption ?? ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {detailPostId && data?.posts.find((p) => p.id === detailPostId) && (
        <PostDetailModal
          post={{ ...data.posts.find((p) => p.id === detailPostId)!, memberId: member.id, groupId: member.groupId }}
          playerName={playerName}
          onClose={() => setDetailPostId(null)}
          onLike={() => handleLike(detailPostId)}
        />
      )}
    </div>
  );
}
