import Link from "next/link";

const s: Record<string, React.CSSProperties> = {
  container: { maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "Inter, system-ui, sans-serif", background: "#0a0a0f", color: "#e0e0e0", lineHeight: 1.7, fontSize: 14, minHeight: "100vh" },
  link: { color: "#FF1493", textDecoration: "none", fontSize: 13, fontWeight: 600 },
  h1: { fontFamily: "Unbounded, cursive", fontSize: 26, fontWeight: 900, color: "#fff", margin: "20px 0 4px" },
  h2: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 28 },
  h3: { fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 20 },
  p: { margin: "6px 0" },
  muted: { color: "#888", fontSize: 12 },
};

export default function PrivacyPage() {
  return (
    <div style={s.container}>
      <Link href="/" style={s.link}>← Back to app</Link>
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.muted}>Last updated: July 19, 2026</p>

      <h2 style={s.h2}>1. Data Controller</h2>
      <p style={s.p}><strong>PropulseDev</strong> — SIRET 10602520800013 — <strong>help@idolbias.com</strong>.</p>

      <h2 style={s.h2}>2. What Data We Collect</h2>

      <h3 style={s.h3}>2.1 Device Identifier</h3>
      <p style={s.p}>When you first visit the Service, a random UUID is generated and stored in your browser as a cookie (<code>idolbias_player_id</code>). This identifier is used to associate your in-game progress (collection, wallet, missions) with your device. It is strictly necessary for the Service to function. No personal information is required to use the Service.</p>

      <h3 style={s.h3}>2.2 Google OAuth (Optional)</h3>
      <p style={s.p}>If you choose to sign in with Google, we receive your name, email address, and profile picture from Google. This information is used only to link your account across devices and to display your profile. We do not store your Google access token beyond what is necessary for authentication. You may revoke access at any time via your Google Account settings.</p>

      <h3 style={s.h3}>2.3 Stripe Payments</h3>
      <p style={s.p}>When you purchase Gems, payment processing is handled entirely by Stripe. We do not see or store your credit card details. Stripe may share with us your payment status, amount paid, and a masked identifier for transaction records. Stripe&rsquo;s privacy policy applies to payment data.</p>

      <h3 style={s.h3}>2.4 Technical Data</h3>
      <p style={s.p}>Our hosting provider (Cloudflare) may collect standard server logs including IP address, browser user-agent, and request timestamps. These logs are retained for security and troubleshooting purposes for a maximum of 30 days.</p>

      <h2 style={s.h2}>3. Legal Basis for Processing</h2>
      <ul style={{ color: "#e0e0e0" }}>
        <li><strong>Device identifier:</strong> Legitimate interest (service functionality) and performance of contract.</li>
        <li><strong>OAuth data:</strong> Consent (you actively choose to sign in).</li>
        <li><strong>Payment data:</strong> Performance of contract (transaction processing).</li>
      </ul>

      <h2 style={s.h2}>4. Data Retention</h2>
      <p style={s.p}>Your in-game data (collection, wallet, progression) is retained as long as your account is active. If you delete your account via the profile page, all associated data is permanently erased within 30 days. Device identifiers are retained for 2 years from last activity. Logs are retained for 30 days.</p>

      <h2 style={s.h2}>5. Your Rights (RGPD)</h2>
      <p style={s.p}>Under applicable data protection law, you have the right to:</p>
      <ul style={{ color: "#e0e0e0" }}>
        <li>Access your personal data</li>
        <li>Rectify inaccurate data</li>
        <li>Erase your data (&ldquo;right to be forgotten&rdquo;) — use the &ldquo;Delete account&rdquo; function in your profile</li>
        <li>Restrict or object to processing</li>
        <li>Data portability</li>
        <li>Withdraw consent at any time (where processing is based on consent)</li>
      </ul>
      <p style={s.p}>To exercise these rights, contact us at <strong>help@idolbias.com</strong>. We will respond within 30 days.</p>

      <h2 style={s.h2}>6. Data Sharing</h2>
      <p style={s.p}>We do not sell your personal data to third parties. We share data only with:</p>
      <ul style={{ color: "#e0e0e0" }}>
        <li><strong>Google:</strong> Authentication (if you choose OAuth)</li>
        <li><strong>Stripe:</strong> Payment processing (if you make a purchase)</li>
        <li><strong>Cloudflare:</strong> Hosting and CDN</li>
      </ul>

      <h2 style={s.h2}>7. Cookies</h2>
      <p style={s.p}>The Service uses one strictly necessary cookie (<code>idolbias_player_id</code>) to identify your device. If you sign in, additional authentication cookies are set by Better Auth. No tracking or advertising cookies are used. You can delete cookies via your browser settings, but this will reset your device identifier.</p>

      <h2 style={s.h2}>8. Data Transfers</h2>
      <p style={s.p}>Your data is hosted by Cloudflare (global edge network) and Stripe (payment processing). Both are certified under the EU-US Data Privacy Framework. Standard contractual clauses are in place for any data transfers outside the EEA.</p>

      <h2 style={s.h2}>9. Children</h2>
      <p style={s.p}>The Service is not directed at children under 13 (or under 15 in France and certain EU countries). We do not knowingly collect data from minors.</p>

      <h2 style={s.h2}>10. Changes</h2>
      <p style={s.p}>We may update this policy. Material changes will be notified via the Service. Continued use after changes constitutes acceptance.</p>

      <h2 style={s.h2}>11. Contact & DPO</h2>
      <p style={s.p}>For privacy inquiries: <strong>help@idolbias.com</strong>.<br />
      You also have the right to lodge a complaint with the CNIL: <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={s.link}>www.cnil.fr</a>.</p>
    </div>
  );
}
