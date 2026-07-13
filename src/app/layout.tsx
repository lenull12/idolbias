import type { Metadata, Viewport } from "next";
import { Unbounded, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Unbounded({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "IdolBias — Where idols come to life",
  description: "Collect photocards of virtual K-pop idols. Your next bias, one pull away.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF1493", // keep in sync with --currency-tickets/--accent-hotpink
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
