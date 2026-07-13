"use client";

import { useState, useEffect } from "react";
import { GROUPS } from "@/data/artists";

type MemberOption = { id: string; stageName: string };

function getMemberOptions(): MemberOption[] {
  return GROUPS.flatMap((g) =>
    g.members.filter((m) => m.revealed).map((m) => ({ id: m.id, stageName: m.stageName }))
  );
}

export default function AdminCosmoPage() {
  const members = getMemberOptions();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [featureReplyId, setFeatureReplyId] = useState("");
  const [responseContent, setResponseContent] = useState("");

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("/api/admin/cosmo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, content, imageUrl: imageUrl || undefined }),
      });
      if (res.ok) {
        setMsg("Diary post created!");
        setContent("");
        setImageUrl("");
        fetchPosts();
      } else {
        const data = await res.json();
        setMsg(data.error ?? "Error");
      }
    } catch {
      setMsg("Network error");
    }
  };

  const fetchPosts = async () => {
    if (!memberId) return;
    try {
      const res = await fetch(`/api/cosmo/member/${memberId}/posts`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      // ignore
    }
  };

  const fetchReplies = async (postId: string) => {
    try {
      const res = await fetch(`/api/admin/cosmo/${postId}/replies`);
      const data = await res.json();
      setReplies(data.replies ?? []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPosts();
    setSelectedPostId(null);
    setReplies([]);
  }, [memberId]);

  const handleFeature = async () => {
    if (!selectedPostId || !featureReplyId || !responseContent) return;
    setMsg("");
    try {
      const res = await fetch(`/api/admin/cosmo/${selectedPostId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyId: featureReplyId, responseContent }),
      });
      if (res.ok) {
        setMsg("Featured!");
        setFeatureReplyId("");
        setResponseContent("");
      } else {
        const data = await res.json();
        setMsg(data.error ?? "Error");
      }
    } catch {
      setMsg("Network error");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20, fontFamily: "system-ui, sans-serif", color: "#fff" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 20px" }}>Admin — Cosmo Room</h1>

      {/* Create post */}
      <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13 }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.stageName}</option>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Diary content..."
          rows={4}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, resize: "vertical" }}
        />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13 }} />
        <button type="submit" style={{ padding: "8px", borderRadius: 8, border: "none", background: "#FF1493", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Create Diary Post</button>
        {msg && <span style={{ fontSize: 12, color: "#9EE6FF" }}>{msg}</span>}
      </form>

      {/* Existing posts */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Posts</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 30 }}>
        {posts.map((p) => (
          <div key={p.id} style={{
            padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: 12,
            cursor: "pointer", border: selectedPostId === p.id ? "1px solid #FF1493" : "1px solid transparent",
          }} onClick={() => { setSelectedPostId(p.id); fetchReplies(p.id); }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.content.slice(0, 100)}</div>
            <div style={{ color: "rgba(255,255,255,0.4)" }}>{new Date(p.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {/* Replies for selected post */}
      {selectedPostId && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Replies</h2>
          {replies.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>No replies yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              {replies.map((r) => (
                <div key={r.id} style={{
                  padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: 12,
                  border: featureReplyId === r.id ? "1px solid #C9B1FF" : "1px solid transparent",
                  cursor: "pointer",
                }} onClick={() => setFeatureReplyId(r.id)}>
                  <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>@{r.authorName}</div>
                  <div>{r.content}</div>
                </div>
              ))}
            </div>
          )}

          {/* Feature form */}
          {featureReplyId && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Selected reply ID: {featureReplyId.slice(0, 8)}...</span>
              <textarea
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Idol's response..."
                rows={3}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, resize: "vertical" }}
              />
              <button onClick={handleFeature} style={{ padding: "8px", borderRadius: 8, border: "none", background: "#C9B1FF", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Feature Reply</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
