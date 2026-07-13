"use client";

import { useState, useEffect, useRef } from "react";
import { GROUPS } from "@/data/artists";

type MemberOption = { id: string; stageName: string; groupId: string };
type FeedPost = { id: string; memberId: string; groupId: string; imageUrl: string; caption: string | null; createdAt: number };

function getMemberOptions(): MemberOption[] {
  return GROUPS.flatMap((g) =>
    g.members.filter((m) => m.revealed).map((m) => ({ id: m.id, stageName: m.stageName, groupId: g.id }))
  );
}

export default function AdminFeedPage() {
  const members = getMemberOptions();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [groupId, setGroupId] = useState(members[0]?.groupId ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [msg, setMsg] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const m = members.find((m) => m.id === memberId);
    if (m) setGroupId(m.groupId);
  }, [memberId, members]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.url);
          setMsg("");
        } else {
          setMsg("Upload failed");
        }
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      };
      reader.onerror = () => { setMsg("Read failed"); setUploading(false); };
      reader.readAsDataURL(file);
    } catch {
      setMsg("Upload error");
      setUploading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!imageUrl) { setMsg("Upload or paste an image URL"); return; }
    try {
      const res = await fetch("/api/admin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, groupId, imageUrl, caption: caption || undefined }),
      });
      if (res.ok) {
        setMsg("Post created!");
        setImageUrl("");
        setCaption("");
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
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20, fontFamily: "system-ui, sans-serif", color: "#fff" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 20px" }}>Admin — Feed</h1>

      <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13 }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.stageName} ({m.groupId})</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{
            padding: "8px 14px", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontWeight: 600,
            whiteSpace: "nowrap",
          }}>
            {uploading ? "Uploading..." : "Choose image"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>or paste URL:</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13,
            }}
          />
        </div>

        {imageUrl && (
          <img src={imageUrl} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, background: "rgba(255,255,255,0.05)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13 }}
        />
        <button type="submit" disabled={!imageUrl}
          style={{
            padding: "8px", borderRadius: 8, border: "none",
            background: imageUrl ? "#FF1493" : "rgba(255,255,255,0.05)",
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: imageUrl ? "pointer" : "default",
          }}
        >
          Create Post
        </button>
        {msg && <span style={{ fontSize: 12, color: "#9EE6FF" }}>{msg}</span>}
      </form>

      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Recent Posts</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {posts.map((p) => (
          <div key={p.id} style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <img src={p.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.caption ?? "(no caption)"}</div>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>{p.memberId} · {new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
            <button
              onClick={async () => {
                if (!confirm("Delete this post?")) return;
                try {
                  const res = await fetch(`/api/admin/feed/${p.id}`, { method: "DELETE" });
                  if (res.ok) fetchPosts();
                  else alert("Delete failed");
                } catch { alert("Delete failed"); }
              }}
              style={{
                padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,80,80,0.3)",
                background: "transparent", color: "#ff5050", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
