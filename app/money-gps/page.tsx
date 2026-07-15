import type { Metadata } from "next";
import { MoneyGpsApp } from "@/components/money-gps/money-gps-app";

export const metadata: Metadata = {
  title: "목표 금액 부족분 해결 도구",
  description:
    "목표와 현재 계획을 입력해 예상 목표 충족률, 부족분, 월 적립·목돈·기간 조정 해결책과 이번 달 실행 계획을 확인하세요.",
  alternates: { canonical: "/money-gps" },
};

export default function MoneyGpsPage() {
  return <MoneyGpsApp autoStart />;
}
