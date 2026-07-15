import type { Metadata } from "next";
import { MoneyGpsApp } from "@/components/money-gps/money-gps-app";

export const metadata: Metadata = {
  title: "내 자산 목표 도착일 계산기",
  description:
    "현재 자산과 매달 모을 돈을 입력해 목표 자산까지 남은 기간과 선택별 시간 차이를 계산해 보세요.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "INVETK Money GPS",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://invetk.com",
    description: "목표 금액과 매달 모을 돈으로 자산 목표 도착일을 계산하는 브라우저 기반 도구",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><MoneyGpsApp /></>;
}
