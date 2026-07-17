"use client";

import { useState } from "react";

type CosmoPost = {
  id: string;
  memberId: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date | number;
};

export default function CosmoDiaryCard({
  post,
  onReply,
}: {
  post: CosmoPost;
  onReply: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(typeof post.createdAt === "number" ? post.createdAt : post.createdAt);

  return (
    <div style={{
      background: "rgba(var(--surface-white-rgb),0.5)",
      borderRadius: 14,
       border: "2px solid rgba(255,158,196,0.1)",
      padding: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-disabled)", fontWeight: 600, letterSpacing: "0.5px" }}>
          {date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
          background: "var(--accent-hotpink)", color: "var(--surface-white)",
          letterSpacing: "0.5px", textTransform: "uppercase",
        }}>Diary</span>
      </div>

      <p style={{
        fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)",
        ...(!expanded && post.content.length > 150 ? {
          display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } : {}),
      }}>
        {post.content}
      </p>

      {post.content.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none", border: "none", color: "var(--accent-hotpink)",
            cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, marginTop: 6,
          }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          style={{ width: "100%", borderRadius: 10, marginTop: 12, objectFit: "cover", maxHeight: 300 }}
        />
      )}

      <button
        onClick={onReply}
        style={{
           marginTop: 12, padding: "8px 14px", borderRadius: 8, border: "2px solid rgba(255,158,196,0.2)",
          background: "transparent", color: "var(--accent-hotpink)", fontWeight: 600,
          fontSize: 12, cursor: "pointer", width: "100%",
        }}
      >
        ✎ Write a reply
      </button>
    </div>
  );
}
