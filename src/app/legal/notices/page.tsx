import Link from "next/link";

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 720, margin: "0 auto", padding: "40px 20px",
    fontFamily: "Inter, system-ui, sans-serif",
    background: "#0a0a0f", color: "#e0e0e0",
    lineHeight: 1.7, fontSize: 14, minHeight: "100vh",
  },
  link: { color: "#FF1493", textDecoration: "none", fontSize: 13, fontWeight: 600 },
  h1: { fontFamily: "Unbounded, cursive", fontSize: 26, fontWeight: 900, color: "#fff", margin: "20px 0 4px" },
  h2: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 28 },
  p: { margin: "6px 0" },
  muted: { color: "#888", fontSize: 12 },
};

export default function NoticesPage() {
  return (
    <div style={s.container}>
      <Link href="/" style={s.link}>← Back to app</Link>
      <h1 style={s.h1}>Legal Notice</h1>
      <p style={s.muted}>Last updated: July 19, 2026</p>

      <h2 style={s.h2}>Publisher</h2>
      <p style={s.p}><strong>PropulseDev</strong><br />
      Legal form: <strong>Entreprise Individuelle (EI)</strong><br />
      SIRET: <strong>10602520800013</strong><br />
      Email: <strong>help@idolbias.com</strong></p>

      <h2 style={s.h2}>Director of Publication</h2>
      <p style={s.p}><strong>Raphaël T.</strong>, as legal representative.</p>

      <h2 style={s.h2}>Hosting</h2>
      <p style={s.p}><strong>Cloudflare, Inc.</strong><br />
      101 Townsend Street, San Francisco, CA 94107, United States<br />
      <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" style={s.link}>www.cloudflare.com</a></p>

      <h2 style={s.h2}>Payment Processor</h2>
      <p style={s.p}><strong>Stripe, Inc.</strong><br />
      510 Townsend Street, San Francisco, CA 94103, United States<br />
      <a href="https://www.stripe.com" target="_blank" rel="noopener noreferrer" style={s.link}>www.stripe.com</a></p>

      <h2 style={s.h2}>Intellectual Property</h2>
      <p style={s.p}>All content, designs, characters, and software comprising IdolBias are the exclusive property of the publisher. Any reproduction, distribution, or unauthorized use is prohibited.</p>

      <h2 style={s.h2}>Consumer Mediation</h2>
      <p style={s.p}>You may refer any dispute to the European Commission's Online Dispute Resolution platform:<br />
      <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={s.link}>ec.europa.eu/consumers/odr</a></p>

      <h2 style={s.h2}>Applicable Law</h2>
      <p style={s.p}>These legal notices are governed by French law. The competent courts of <strong>Paris</strong> have jurisdiction in case of dispute.</p>
    </div>
  );
}
