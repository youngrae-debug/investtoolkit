import { MoneyGpsApp } from "@/components/money-gps/money-gps-app";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/site";
import { createWebPageStructuredData } from "@/lib/seo/structured-data";

const title = "목표 금액 부족분 계산기와 정책 혜택 찾기";
const description =
  "목표 금액·날짜, 현재 자산, 월 적립액을 입력해 예상 부족분과 월 적립 확대·월 적립과 시작 자금 조합·기간 조정 해결책, 정책 혜택 가능성을 확인하세요.";

export const metadata = createPageMetadata({ title, description, path: "/" });

const structuredData = createWebPageStructuredData({
  name: title,
  description,
  path: "/",
});

export default function Home() {
  return <><JsonLd data={structuredData} /><MoneyGpsApp /></>;
}
