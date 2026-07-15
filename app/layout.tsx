import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://invetk.com"),
  title: {
    default: "INVETK | 내 자산 목표 도착일 계산기",
    template: "%s | INVETK",
  },
  description:
    "목표 금액, 지금까지 모은 돈, 매달 모을 돈으로 목표까지 남은 기간과 예상 도착 연월을 계산해 보세요.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "내 돈의 목적지, 언제 도착할까요?",
    description: "세 가지 금액만으로 확인하는 나의 목표 도착일",
    url: "https://invetk.com",
    siteName: "INVETK Money GPS",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og.png", width: 1733, height: 907, alt: "INVETK Money GPS — 내 돈의 목적지, 언제 도착할까요?" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "INVETK Money GPS",
    description: "세 가지 금액만으로 확인하는 나의 목표 도착일",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
