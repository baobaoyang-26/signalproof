import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalproof.co",
  ),
  title: {
    default: "SignalProof - Reddit Pain Point Reports for SaaS Founders",
    template: "%s | SignalProof",
  },
  description:
    "Validate SaaS ideas with human-reviewed Reddit pain point reports built from public user complaints, competitor frustration, and buying-intent signals.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "SignalProof - Build from market signal, not founder intuition",
    description:
      "Get a founder-ready opportunity report built from public Reddit pain points, repeated workarounds, and competitor frustration. Delivered in 24 hours.",
    url: "https://signalproof.co",
    siteName: "SignalProof",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SignalProof - Reddit Pain Point Reports for SaaS Founders",
    description:
      "Validate SaaS ideas with human-reviewed Reddit pain point reports delivered in 24 hours.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
