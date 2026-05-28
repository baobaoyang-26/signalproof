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

import { CheckoutReturnGuard } from "@/components/checkout-return-guard";
import { METADATA, SITE_NAME } from "@/lib/site-copy";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: METADATA.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: METADATA.description,
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    google: "notranslate",
  },
  openGraph: {
    title: METADATA.ogTitle,
    description: METADATA.ogDescription,
    url: siteUrl(),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark notranslate" lang="en" translate="no">
      <body className="min-h-screen bg-canvas text-white antialiased notranslate" translate="no">
        <CheckoutReturnGuard />
        {children}
      </body>
    </html>
  );
}
