"use client";

import { useState, useEffect } from "react";
import { GROUPS, getGroup } from "@/data/artists";
import CosmoDiaryCard from "./CosmoDiaryCard";
import PrivateThread from "./PrivateThread";
import PublicWall from "./PublicWall";

type MemberInfo = {
  id: string;
  stageName: string;
  color: string;
  profileImage?: string;
};

function getAllMembers(): MemberInfo[] {
  return GROUPS.flatMap((g) =>
    g.members
      .filter((m) => m.revealed)
      .map((m) => ({ id: `${g.id}_${m.id}`, stageName: m.stageName, color: m.color, profileImage: m.profileImage }))
  );
}

type Tab = "diary" | "private" | "public";

export default function CosmoRoomView({ playerName }: { playerName: string }) {
  const members = getAllMembers();
  const [activeMember, setActiveMember] = useState(members[0]?.id ?? "");
  const [posts, setPosts] = useState<any[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("diary");
  const [loading, setLoading] = useState(true);

  const [groupId, memberId] = activeMember.split("_");

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/cosmo/member/${memberId}/posts`);
        const data = await res.json();
        setPosts(data.posts ?? []);
        if (data.posts?.length > 0) setActivePostId(data.posts[0].id);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId]);

  const currentMember = members.find((m) => m.id === activeMember);
  if (!currentMember) return null;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "12px 0" }}>
      <div style={{ padding: "0 14px 14px" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900,
          backgroundImage: "linear-gradient(100deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))",
          backgroundSize: "300% 100%", WebkitBackgroundClip: "text", backgroundClip: "text",
          color: "transparent", letterSpacing: "-0.5px",
        }}>Cosmo Room</h1>
        <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>
          Connect with your idols
        </span>
      </div>

      {/* Member selector */}
      <div style={{
        display: "flex", gap: 6, overflow: "auto", padding: "0 14px 12px",
        scrollbarWidth: "none",
      }}>
        {members.map((m) => {
          const isActive = m.id === activeMember;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMember(m.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "6px 10px", borderRadius: 10, border: "2px solid",
                borderColor: isActive ? m.color : "transparent",
                background: isActive ? `${m.color}15` : "rgba(255,255,255,0.02)",
                cursor: "pointer", minWidth: 60,
              }}
            >
              {m.profileImage && (
                <img
                  src={m.profileImage}
                  alt={m.stageName}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? m.color : "var(--text-muted)" }}>
                {m.stageName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      {activePostId && (
        <div style={{ display: "flex", gap: 2, padding: "0 14px", marginBottom: 12 }}>
          {(["diary", "private", "public"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: tab === t ? "rgba(255,158,196,0.1)" : "transparent",
                color: tab === t ? "var(--accent-hotpink)" : "var(--text-muted)",
                fontWeight: 600, fontSize: 12, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t === "diary" ? "Diary" : t === "private" ? "My Letters" : "Public Wall"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "0 14px" }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)",
              borderTopColor: "var(--accent-hotpink)", animation: "spin 0.8s linear infinite",
              margin: "0 auto",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : tab === "diary" ? (
          posts.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--text-disabled)", fontSize: 13 }}>
              No diary entries yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map((post) => (
                <CosmoDiaryCard
                  key={post.id}
                  post={post}
                  onReply={() => {
                    setActivePostId(post.id);
                    setTab("private");
                  }}
                />
              ))}
            </div>
          )
        ) : tab === "private" && activePostId ? (
          <PrivateThread
            postId={activePostId}
            memberId={memberId}
            playerName={playerName}
          />
        ) : tab === "public" ? (
          <PublicWall memberId={memberId} />
        ) : null}
      </div>
    </div>
  );
}
