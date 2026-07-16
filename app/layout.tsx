import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const metadataBase = process.env.NODE_ENV === "production"
  ? new URL("https://invetk.com")
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "INVETK | 돈 목표 부족분 해결 도구",
    template: "%s | INVETK",
  },
  description:
    "목표와 현재 계획을 입력하면 부족분과 세 가지 해결책을 진단하고, 놓치기 쉬운 정책 혜택과 이번 달 실행 계획까지 제공합니다.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "5년 안에 1억, 지금 계획으로 가능할까요?",
    description: "목표 충족률과 부족분을 진단하고 월 적립·목돈·기간 조정 해결책을 만드는 Money GPS",
    url: "https://invetk.com",
    siteName: "INVETK Money GPS",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og.png", width: 1732, height: 908, alt: "INVETK Money GPS — 목표 진단에서 이번 달 실행까지" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "INVETK Money GPS",
    description: "예상 목표 충족률과 부족분, 월 적립·목돈·기간 조정 해결책",
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
