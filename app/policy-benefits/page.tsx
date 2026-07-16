import type { Metadata } from "next";
import { PolicyBenefitFinder } from "@/components/money-gps/policy-benefit-finder";

export const metadata: Metadata = {
  title: "정책 혜택 찾기",
  description: "나이와 소득, 가구 조건으로 정책형 적금과 자산형성 지원 통장의 대상 가능성을 간단히 확인하세요.",
  alternates: { canonical: "/policy-benefits" },
};

export default function PolicyBenefitsPage() {
  return (
    <main id="main-content" className="policy-benefits-page">
      <header className="policy-benefits-hero">
        <span className="section-kicker">Policy Benefits</span>
        <h1>놓치고 있던 정책 혜택까지<br />내 목표에 연결합니다</h1>
        <p>복잡한 행정용어를 직접 판단하지 않아도 됩니다. 기본 조건을 입력하면 대상 가능성과 모집 상태, 공식 확인 경로를 한눈에 정리해 드려요.</p>
        <ul aria-label="정책 혜택 찾기 특징">
          <li>공식 출처와 확인일 표시</li>
          <li>가입 확정이 아닌 간이 확인</li>
          <li>입력 정보 서버 전송 없음</li>
        </ul>
      </header>
      <PolicyBenefitFinder autoOpen standalone />
      <section className="policy-source-note" aria-labelledby="policy-source-title">
        <span className="section-kicker">확인 원칙</span>
        <h2 id="policy-source-title">가능성을 먼저 찾고, 결정은 공식 심사로</h2>
        <p>정책의 모집 기간과 세부 자격은 바뀔 수 있습니다. INVETK는 공식 기관의 기본 조건으로 가능성을 좁혀드리고, 최종 가입 여부와 지원액은 각 정책의 공식 페이지에서 확인하도록 연결합니다.</p>
      </section>
    </main>
  );
}
