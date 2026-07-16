import { MoneyGpsApp } from "@/components/money-gps/money-gps-app";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/site";
import { createWebApplicationStructuredData } from "@/lib/seo/structured-data";

const title = "목표 금액 부족분 계산기";
const description =
  "목표 금액과 날짜, 현재 자산과 월 적립액으로 예상 목표 충족률과 부족분을 계산하고 세 가지 해결책과 이번 달 실행 계획을 확인하세요.";

export const metadata = createPageMetadata({
  title,
  description,
  path: "/money-gps",
});

const structuredData = createWebApplicationStructuredData({
  name: "INVETK 목표 금액 부족분 계산기",
  description,
  path: "/money-gps",
  features: [
    "목표 날짜 예상 부족분 계산",
    "월 적립액·목돈·기간 조정 해결책 비교",
    "이번 달 행동 계획",
    "브라우저 로컬 계획 저장과 백업",
  ],
});

export default function MoneyGpsPage() {
  return <><JsonLd data={structuredData} /><MoneyGpsApp autoStart /></>;
}
