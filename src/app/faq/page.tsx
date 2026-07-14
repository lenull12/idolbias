"use client";

import { useState } from "react";
import Link from "next/link";

const s: Record<string, React.CSSProperties> = {
  container: { maxWidth: 600, margin: "0 auto", padding: "40px 20px", minHeight: "100vh" },
  link: { color: "var(--accent-hotpink)", textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans, monospace)" },
  h1: { fontFamily: "var(--font-display, cursive)", fontSize: 28, margin: "16px 0 4px", color: "var(--text-primary)" },
  muted: { fontSize: 12, color: "var(--text-muted)", margin: "0 0 24px" },
};

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: "🎴 How do I get photocards?", a: "TODO" },
  { q: "🎴 What do the rarities mean?", a: "TODO" },
  { q: "🎴 What is the pull system?", a: "TODO" },
  { q: "💎 What are Gems, Tickets, and Dust?", a: "TODO" },
  { q: "💎 How do I get more Gems?", a: "TODO" },
  { q: "💎 What is the Welcome Gift?", a: "TODO" },
  { q: "⭐ What is a bias and how does it work?", a: "TODO" },
  { q: "⭐ How often can I change my bias?", a: "TODO" },
  { q: "🔄 How do I disenchant cards?", a: "TODO" },
  { q: "🔄 How do I craft cards?", a: "TODO" },
  { q: "🔄 How does trading work?", a: "TODO" },
  { q: "🔥 What is the daily streak?", a: "TODO" },
  { q: "🔥 How do daily/weekly missions work?", a: "TODO" },
  { q: "🔥 What are Lifetime achievements?", a: "TODO" },
  { q: "👤 Do I need an account?", a: "TODO" },
  { q: "👤 How do I reset my password?", a: "TODO" },
  { q: "👤 How do I delete my account?", a: "TODO" },
  { q: "🆘 I found a bug / have a question", a: "TODO" },
];

function AccordionItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{
      border: "1.5px solid rgba(var(--text-primary-rgb),0.1)",
      borderRadius: 10, overflow: "hidden",
      background: "var(--surface-white)",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "12px 14px", border: "none", cursor: "pointer",
          background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)",
          textAlign: "left",
        }}
      >
        <span>{q}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 12px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={s.container}>
      <Link href="/" style={s.link}>← Back to app</Link>
      <h1 style={s.h1}>Frequently Asked Questions</h1>
      <p style={s.muted}>Everything you need to know about IdolBias</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem
            key={i}
            q={item.q}
            a={item.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>

      <div style={{
        marginTop: 32, padding: 16, borderRadius: 10, textAlign: "center",
        border: "1.5px solid var(--accent-hotpink)",
        background: "linear-gradient(135deg, rgba(255,20,147,0.04), rgba(201,177,255,0.06))",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Still have questions?
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
          Reach out to us directly
        </div>
        <a href="mailto:help@idolbias.com" style={{
          display: "inline-block", padding: "8px 20px", borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
          color: "var(--surface-white)", fontWeight: 700, fontSize: 13, textDecoration: "none",
        }}>
          Contact us
        </a>
      </div>
    </div>
  );
}
