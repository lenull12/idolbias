"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FeedPostCard from "./FeedPostCard";
import FeedTabs, { type FeedMode } from "./FeedTabs";
import AccountSearch from "./AccountSearch";
import PostDetailModal from "./PostDetailModal";

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

export default function FeedView({
  playerName,
  playerId,
  onViewProfile,
  onBumpMission,
  onBumpWeekly,
}: {
  playerName: string;
  playerId?: string | null;
  onViewProfile: (memberId: string, groupId: string) => void;
  onBumpMission?: (id: string) => void;
  onBumpWeekly?: (id: string) => void;
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubs, setHasSubs] = useState(false);
  const [mode, setMode] = useState<FeedMode>("foryou");
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<FeedPost | null>(null);
  const loadingRef = useRef(false);

  const apiHeaders = () => {
    const h: Record<string, string> = {};
    if (playerId) h["x-player-id"] = playerId;
    return h;
  };

  const fetchPosts = useCallback(async (cursorVal: string | null = null, feedMode?: FeedMode) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const m = feedMode ?? mode;
    try {
      const url = `/api/feed?limit=10&mode=${m}${cursorVal ? `&cursor=${cursorVal}` : ""}`;
      const res = await fetch(url, { headers: apiHeaders() });
      if (!res.ok) {
        console.error("Feed API error:", res.status, await res.text());
        if (!cursorVal) setPosts([]);
        return;
      }
      const data = await res.json();
      if (cursorVal) {
        setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      } else {
        setPosts(data.posts ?? []);
        setHasSubs(data.hasSubs ?? false);
      }
      setCursor(data.nextCursor);
    } catch (err) {
      console.error("Feed fetch error:", err);
      if (!cursorVal) setPosts([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [mode]);

  useEffect(() => { fetchPosts(null); onBumpMission?.("view_feed"); }, [fetchPosts, onBumpMission]);

  const handleModeChange = (newMode: FeedMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setPosts([]);
    setCursor(null);
    setLoading(true);
    fetchPosts(null, newMode);
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
          : p
      )
    );
    try {
      const res =       await fetch(`/api/feed/${postId}/like`, { method: "POST", headers: apiHeaders() });
      if (res.ok) { onBumpMission?.("like_posts"); onBumpMission?.("like_10_posts"); onBumpWeekly?.("like_20_posts"); }
      else console.error("Like failed:", await res.text());
    } catch (err) {
      console.error("Like network error:", err);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
            : p
        )
      );
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders() },
        body: JSON.stringify({ authorName: playerName, content: text }),
      });
      if (res.ok) {
        onBumpMission?.("comment_posts"); onBumpWeekly?.("comment_10_posts");
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  commentCount: p.commentCount + 1,
                  previewComments: [
                    ...p.previewComments,
                    {
                      id: "temp",
                      postId,
                      userId: null,
                      authorName: playerName,
                      content: text,
                      isOfficial: false,
                      createdAt: new Date().toISOString(),
                    },
                  ].slice(-2),
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const handleToggleSubscribe = async (memberId: string, groupId: string, currentlySubscribed: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.memberId === memberId ? { ...p, isSubscribed: !currentlySubscribed } : p
      )
    );
    try {
      const endpoint = currentlySubscribed ? "/api/feed/unsubscribe" : "/api/feed/subscribe";
      const subRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders() },
        body: JSON.stringify({ memberId, groupId }),
      });
      if (subRes.ok && !currentlySubscribed) { onBumpMission?.("follow_artist"); onBumpMission?.("follow_member"); onBumpWeekly?.("follow_5_artists"); }
      setHasSubs(true);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.memberId === memberId ? { ...p, isSubscribed: currentlySubscribed } : p
        )
      );
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 16px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
            ✦ Feed
          </span>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
              color: searchOpen ? "var(--accent-hotpink)" : "var(--text-muted)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
        <h1 style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px",
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          margin: 0, lineHeight: 1.1,
        }}>
          what's new
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          Follow your favorite idols and connect with the community
        </span>
      </div>

      {/* Search dropdown (pushes content down) */}
      <AccountSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectMember={(memberId, groupId) => {
          setSearchOpen(false);
          onViewProfile(memberId, groupId);
        }}
        playerName={playerName}
      />

      {/* Tabs */}
      <FeedTabs mode={mode} onChange={handleModeChange} hasSubs={hasSubs} />

      {/* Content */}
      {loading && posts.length === 0 ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ margin: "0 14px 16px", background: "rgba(var(--surface-white-rgb),0.3)", borderRadius: 14, overflow: "hidden", height: 460 }}>
            <div style={{ height: 40, background: "rgba(255,255,255,0.05)", marginBottom: 4 }} />
            <div style={{ height: 300, background: "rgba(255,255,255,0.03)" }} />
            <div style={{ height: 60, background: "rgba(255,255,255,0.03)", marginTop: 4 }} />
          </div>
        ))
      ) : posts.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{mode === "following" ? "📭" : "📸"}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            {mode === "following"
              ? "Follow some idols to see their posts here"
              : "No posts yet"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-disabled)" }}>
            {mode === "following"
              ? "Use the search to find idols and follow them"
              : "Check back later for new content"}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 14px" }}>
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                playerName={playerName}
                onLike={() => handleLike(post.id)}
                onComment={(text) => handleComment(post.id, text)}
                onToggleSubscribe={() => handleToggleSubscribe(post.memberId, post.groupId, post.isSubscribed)}
                onViewProfile={() => onViewProfile(post.memberId, post.groupId)}
                onViewAllComments={() => setDetailPost(post)}
              />
            ))}
          </div>

          {posts.length > 0 && cursor && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <button
                onClick={() => fetchPosts(cursor)}
                disabled={loading}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,158,196,0.2)",
                  background: "transparent", color: "var(--accent-hotpink)", fontWeight: 600,
                  fontSize: 13, cursor: "pointer",
                }}
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}

          {!loading && posts.length > 0 && !cursor && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-disabled)", fontSize: 12 }}>
              You're all caught up ✦
            </div>
          )}
        </>
      )}

      {/* Post detail modal */}
      {detailPost && (
        <PostDetailModal
          post={detailPost}
          playerName={playerName}
          onClose={() => setDetailPost(null)}
          onLike={() => handleLike(detailPost.id)}
        />
      )}
    </div>
  );
}
