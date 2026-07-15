import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Money GPS 계산 기준",
  description: "월별 순유입액, 복리 수익률, 월말 납입, 목표 도착일과 자금 부족 상태를 계산하는 기준과 한계를 공개합니다.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <main id="main-content" className="content-page article-page">
      <header className="article-header"><span className="section-kicker">투명한 계산</span><h1>Money GPS는 이렇게 계산합니다</h1><p>결과를 믿으라고 말하기보다, 어떤 숫자와 가정으로 계산했는지 공개합니다.</p><small>최종 업데이트 2026년 7월 15일</small></header>
      <article className="article-body">
        <section><h2>1. 금융자산의 의미</h2><p>지금까지 모은 돈은 목표에 실제로 사용할 수 있는 예금과 투자자산의 합계입니다. 전세보증금이나 퇴직연금처럼 당장 목표에 쓰기 어려운 자산은 제외하는 편이 계획에 더 맞습니다. Money GPS는 여러 자산을 하나의 금액으로 단순화합니다.</p></section>
        <section><h2>2. 첫 결과는 원금 기준입니다</h2><p>첫 계산에서는 연 수익률을 0%로 두고 목표 금액, 지금까지 모은 돈, 매달 모을 돈만 사용합니다. 현재 3,000만 원, 목표 1억 원, 월 100만 원이라면 남은 7,000만 원을 채우는 데 70개월, 즉 5년 10개월이 필요합니다.</p></section>
        <section><h2>3. 월급과 지출로 매달 모을 돈 계산</h2><div className="formula-box">매달 모을 돈 = 월 실수령액 − 고정비 − 생활비 − 대출 상환액</div><p>월급 350만 원, 고정비 100만 원, 생활비 100만 원, 대출 상환액 50만 원이면 매달 모을 돈은 100만 원입니다. 지출 합계가 월급보다 크면 음수로 계산하며, 이를 0원으로 숨기지 않습니다.</p></section>
        <section><h2>4. 월말 납입과 복리 적용 순서</h2><p>첫 정기 적립액은 다음 달 말에 들어온다고 가정합니다. 매월 초 자산에 월 수익률을 먼저 적용하고, 그다음 월 적립액과 일회성 자금을 더하거나 뺍니다.</p><div className="formula-box">월 수익률 = (1 + 연 수익률)<sup>1/12</sup> − 1<br />월말 자산 = 월초 자산 × (1 + 월 수익률) + 월 적립액 + 일회성 자금</div></section>
        <section><h2>5. 수익률 가정</h2><p>연 수익률은 -20%부터 30% 사이에서 월 수익률로 바꿔 적용합니다. 화면의 0%, 2%, 4%, 6% 선택지는 추천값이 아니라 결과가 가정에 얼마나 민감한지 보는 예시입니다. 실제 시장 결과의 범위를 보장하지 않습니다.</p></section>
        <section><h2>6. 목표 도착일과 자금 부족</h2><p>현재 자산이 목표 금액 이상이면 0개월로 표시합니다. 매월 계산 뒤 자산이 목표 이상이 되는 첫 달을 예상 도착 연월로 사용합니다. 큰 지출이나 적자로 잔액이 0원 아래로 내려가면 ‘이 계획을 유지하면 돈이 부족해질 수 있어요’라고 표시하고 부족 금액과 시점을 함께 계산합니다.</p></section>
        <section><h2>7. 계산 범위와 한계</h2><p>최대 계산 기간은 1,200개월, 즉 100년입니다. 세금, 거래 수수료, 물가상승률, 자산별 위험과 수익률 차이는 기본 계산에 포함하지 않습니다. 모든 금융자산에 하나의 혼합 수익률을 적용하기 때문에 실제 금융기관의 결과와 차이가 날 수 있습니다.</p></section>
        <section className="example-box"><span>기억할 점</span><h2>날짜는 약속이 아니라 비교 기준입니다</h2><p>Money GPS의 목적은 미래를 확정하는 것이 아니라, 월 10만 원 증가나 큰 지출 같은 선택이 목표일까지의 시간을 얼마나 바꾸는지 같은 기준으로 비교하는 것입니다.</p><Link className="button button--primary" href="/money-gps">내 목표일 계산하기</Link></section>
      </article>
    </main>
  );
}

