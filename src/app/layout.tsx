import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Manrope,
} from "next/font/google";

import { getSiteSettings } from "@/lib/content/queries";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const sansFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  const siteName = siteSettings.metaTitle || siteSettings.siteName;
  const description = siteSettings.metaDescription || siteSettings.siteDescription;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: siteName,
      template: `%s | ${siteSettings.siteName}`,
    },
    description,
    openGraph: {
      title: siteName,
      description,
      type: "website",
      images: siteSettings.ogImageUrl
        ? [{ url: siteSettings.ogImageUrl, alt: siteSettings.siteName }]
        : undefined,
    },
    twitter: {
      card: siteSettings.ogImageUrl ? "summary_large_image" : "summary",
      title: siteName,
      description,
      images: siteSettings.ogImageUrl ? [siteSettings.ogImageUrl] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
