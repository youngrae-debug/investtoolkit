import type { Metadata } from "next";
import { MoneyGpsApp } from "@/components/money-gps/money-gps-app";

export const metadata: Metadata = {
  title: "자산 목표 도착일 계산기",
  description:
    "목표 금액, 지금까지 모은 돈, 매달 모을 돈으로 예상 목표 도착일을 계산하고 조건을 바꿔 비교해 보세요.",
  alternates: { canonical: "/money-gps" },
};

export default function MoneyGpsPage() {
  return <MoneyGpsApp autoStart />;
}
