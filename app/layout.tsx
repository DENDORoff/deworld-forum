import type { Metadata, Viewport } from "next";
import { Rubik, Russo_One } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { absoluteUrl, siteUrl } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const russoOne = Russo_One({
  variable: "--font-russo",
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "DEWORLD",
    "Minecraft сервер",
    "майнкрафт сервер",
    "форум Minecraft",
    "DENDOR",
    "mc.de-world.net",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: "DENDOR", url: "https://de-world.net" }],
  creator: "DENDOR",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl(),
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/brand/deworld-banner.png"),
        width: 1280,
        height: 720,
        alt: "DEWORLD — Всё ещё Minecraft, просто лучше",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/brand/deworld-banner.png")],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: siteUrl(),
  description: SITE_DESCRIPTION,
  inLanguage: "ru",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${rubik.variable} ${russoOne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-stone-900">
        <Suspense fallback={<SiteHeaderSkeleton />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieBanner />
        <ConfirmDialog />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
