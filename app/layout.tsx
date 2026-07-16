import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE,
} from "@/lib/seo/site";
import { GLOBAL_STRUCTURED_DATA } from "@/lib/seo/structured-data";
import "./globals.css";

const metadataBase = process.env.NODE_ENV === "production"
  ? new URL(SITE_URL)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  applicationName: SITE_NAME,
  title: {
    default: "INVETK Money GPS | 목표 금액 부족분 계산기",
    template: "%s | INVETK",
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: "INVETK", url: SITE_URL }],
  creator: "INVETK",
  publisher: "INVETK",
  category: "finance",
  alternates: { canonical: SITE_URL },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "INVETK Money GPS | 목표 금액 부족분 계산기",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "INVETK Money GPS | 목표 금액 부족분 계산기",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <JsonLd data={GLOBAL_STRUCTURED_DATA} />
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
