"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type SearchResult = {
  memberId: string;
  groupId: string;
  stageName: string;
  groupName: string;
  avatar: string | null;
  color: string;
  followerCount: number;
  isFollowedByMe: boolean;
};

export default function AccountSearch({
  open,
  onClose,
  onSelectMember,
  playerName,
}: {
  open: boolean;
  onClose: () => void;
  onSelectMember: (memberId: string, groupId: string) => void;
  playerName: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, handleSearch]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const handleToggleFollow = async (memberId: string, groupId: string, currentlyFollowed: boolean) => {
    setResults((prev) =>
      prev.map((r) =>
        r.memberId === memberId ? { ...r, isFollowedByMe: !currentlyFollowed } : r
      )
    );
    try {
      const endpoint = currentlyFollowed ? "/api/feed/unsubscribe" : "/api/feed/subscribe";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, groupId }),
      });
    } catch {
      setResults((prev) =>
        prev.map((r) =>
          r.memberId === memberId ? { ...r, isFollowedByMe: currentlyFollowed } : r
        )
      );
    }
  };

  const handleBlur = () => {
    if (!query.trim()) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        padding: "0 14px 12px",
        borderBottom: "1px solid rgba(255,158,196,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: results.length > 0 ? 12 : 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={handleBlur}
          placeholder="Search idols..."
          style={{
            flex: 1, padding: "6px 0", border: "none", background: "transparent",
            fontSize: 14, outline: "none", color: "var(--text-primary)",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <div style={{ padding: "8px 0", fontSize: 12, color: "var(--text-disabled)" }}>Searching...</div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {results.map((r) => (
            <div
              key={r.memberId}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 8px", borderRadius: 8, cursor: "pointer",
              }}
              onMouseDown={(e) => { e.preventDefault(); onSelectMember(r.memberId, r.groupId); }}
            >
              {r.avatar && (
                <img
                  src={r.avatar}
                  alt={r.stageName}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${r.color}` }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{r.stageName}</div>
                <div style={{ fontSize: 11, color: "var(--text-disabled)" }}>{r.groupName}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleFollow(r.memberId, r.groupId, r.isFollowedByMe); }}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: "1px solid",
                  borderColor: r.isFollowedByMe ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.15)",
                  background: r.isFollowedByMe ? "var(--accent-hotpink)" : "transparent",
                  color: r.isFollowedByMe ? "var(--surface-white)" : "var(--text-muted)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                }}
              >
                {r.isFollowedByMe ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div style={{ padding: "8px 0", fontSize: 12, color: "var(--text-disabled)" }}>No results</div>
      )}
    </div>
  );
}
