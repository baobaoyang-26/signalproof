import type { Metadata } from "next";
import "./globals.css";

function siteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "http://localhost:3000",
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      return new URL(normalized).toString().replace(/\/$/, "");
    } catch {
      continue;
    }
  }

  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "SignalProof — AI Validation Reports for Founders",
    template: "%s | SignalProof",
  },
  description:
    "VC-grade startup validation from real website evidence and market signal. Delivered in 24 hours.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "SignalProof — Build from evidence, not intuition",
    description:
      "Partner-level validation memos powered by live website scrape and AI analysis.",
    url: siteUrl(),
    siteName: "SignalProof",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className="min-h-screen bg-canvas text-white antialiased">{children}</body>
    </html>
  );
}
