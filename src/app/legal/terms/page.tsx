import Link from "next/link";

const s: Record<string, React.CSSProperties> = {
  container: { maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "Inter, system-ui, sans-serif", background: "#0a0a0f", color: "#e0e0e0", lineHeight: 1.7, fontSize: 14, minHeight: "100vh" },
  link: { color: "#FF1493", textDecoration: "none", fontSize: 13, fontWeight: 600 },
  h1: { fontFamily: "Unbounded, cursive", fontSize: 26, fontWeight: 900, color: "#fff", margin: "20px 0 4px" },
  h2: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 28 },
  h3: { fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 20 },
  p: { margin: "6px 0" },
  muted: { color: "#888", fontSize: 12 },
  box: { background: "rgba(255,20,147,0.08)", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,20,147,0.2)", fontSize: 13 },
};

export default function TermsPage() {
  return (
    <div style={s.container}>
      <Link href="/" style={s.link}>← Back to app</Link>
      <h1 style={s.h1}>Terms of Service</h1>
      <p style={s.muted}>Last updated: July 19, 2026</p>

      <h2 style={s.h2}>1. Service Description</h2>
      <p style={s.p}>IdolBias is a digital collectible platform where users can collect virtual photocards of fictional K-pop idols through a gacha system. The Service is provided by <strong>PropulseDev</strong> — SIRET 10602520800013 — <strong>help@idolbias.com</strong>.</p>

      <h2 style={s.h2}>2. Account</h2>
      <p style={s.p}>Access to the Service is granted through a device identifier stored in a browser cookie. You may optionally link your account via Google OAuth to persist your collection across devices. You are responsible for maintaining the confidentiality of your device and Google account.</p>

      <h2 style={s.h2}>3. Virtual Currency — Gems</h2>
      <p style={s.p}>Gems are a virtual, non-refundable, non-exchangeable in-app currency used exclusively within IdolBias to purchase card packs. Gems hold no monetary value and cannot be redeemed for cash, transferred to another user, or exchanged outside the Service. All purchases of Gems are final and non-refundable.</p>

      <h3 style={s.h3}>3.1 Waiver of Right of Withdrawal</h3>
      <p style={s.p}>By purchasing Gems, you expressly agree that the digital content (Gems) is provided immediately upon purchase and you waive your right of withdrawal under applicable consumer protection laws (including Article L.221-28 of the French Consumer Code for users in France). You acknowledge that the purchase is final and non-refundable once the transaction is completed.</p>
      <div style={s.box}>
        <strong>Confirmation required:</strong> In compliance with article L.221-28 of the French Consumer Code, you acknowledge and accept that the supply of digital content (Gems) begins immediately after payment, and that you therefore waive your right of withdrawal. This waiver is confirmed via a checkbox at the time of each purchase.
      </div>

      <h2 style={s.h2}>4. Card Packs and Probabilities</h2>
      <p style={s.p}>Card packs contain randomly selected digital photocards. Drop rates vary by pack type and are displayed in the shop at the time of purchase. Probabilities are disclosed for transparency and may be updated with advance notice.</p>

      <h2 style={s.h2}>5. Prohibited Conduct</h2>
      <p style={s.p}>You agree not to: exploit bugs or glitches, use automated scripts or bots, attempt to reverse-engineer the gacha system, engage in fraudulent payment activity, or otherwise disrupt the Service for other users. Violations may result in account suspension without refund.</p>

      <h2 style={s.h2}>6. Availability</h2>
      <p style={s.p}>The Service is provided &ldquo;as is&rdquo; without guarantees of uninterrupted availability. Maintenance, updates, or unforeseen issues may temporarily affect access. We reserve the right to modify, suspend, or discontinue the Service at any time.</p>

      <h2 style={s.h2}>7. Intellectual Property</h2>
      <p style={s.p}>All virtual items, characters, designs, and content within IdolBias are the exclusive property of the publisher. Users are granted a limited, revocable, non-transferable license to use the Service for personal entertainment purposes.</p>

      <h2 style={s.h2}>8. Limitation of Liability</h2>
      <p style={s.p}>To the maximum extent permitted by law, the editor shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the Service, including but not limited to loss of virtual items or in-app currency.</p>

      <h2 style={s.h2}>9. Governing Law and Disputes</h2>
      <p style={s.p}>These Terms are governed by French law. Any disputes shall be submitted to the competent courts of Paris.</p>

      <h2 style={s.h2}>10. Contact</h2>
      <p style={s.p}>For any questions regarding these Terms, contact us at <strong>help@idolbias.com</strong>.</p>
    </div>
  );
}
