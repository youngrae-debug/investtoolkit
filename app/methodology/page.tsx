import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Money GPS 계산 기준",
  description: "목표 날짜의 예상 충족률과 부족분, 월 적립·목돈·기간 조정 해결책을 계산하는 기준을 공개합니다.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <main id="main-content" className="content-page article-page">
      <header className="article-header"><span className="section-kicker">투명한 계산</span><h1>Money GPS는 이렇게 계산합니다</h1><p>결과를 믿으라고 말하기보다, 어떤 숫자와 가정으로 계산했는지 공개합니다.</p><small>최종 업데이트 2026년 7월 15일</small></header>
      <article className="article-body">
        <section><h2>1. 금융자산의 의미</h2><p>지금까지 모은 돈은 목표에 실제로 사용할 수 있는 예금과 투자자산의 합계입니다. 전세보증금이나 퇴직연금처럼 당장 목표에 쓰기 어려운 자산은 제외하는 편이 계획에 더 맞습니다. Money GPS는 여러 자산을 하나의 금액으로 단순화합니다.</p></section>
        <section><h2>2. 첫 결과는 목표 날짜의 부족분입니다</h2><p>첫 계산에서는 연 수익률을 0%로 둡니다. 현재 3,000만 원에서 월 100만 원씩 5년간 모으면 9,000만 원입니다. 목표가 1억 원이라면 목표 날짜 기준 부족분은 1,000만 원입니다.</p><div className="formula-box">부족분 = 목표 금액 − 목표 날짜의 예상 금액</div></section>
        <section><h2>3. 월급과 지출로 매달 모을 돈 계산</h2><div className="formula-box">매달 모을 돈 = 월 실수령액 − 고정비 − 생활비 − 대출 상환액</div><p>월급 350만 원, 고정비 100만 원, 생활비 100만 원, 대출 상환액 50만 원이면 매달 모을 돈은 100만 원입니다. 지출 합계가 월급보다 크면 음수로 계산하며, 이를 0원으로 숨기지 않습니다.</p></section>
        <section><h2>4. 월말 납입과 복리 적용 순서</h2><p>첫 정기 적립액은 다음 달 말에 들어온다고 가정합니다. 매월 초 자산에 월 수익률을 먼저 적용하고, 그다음 월 적립액과 일회성 자금을 더하거나 뺍니다.</p><div className="formula-box">월 수익률 = (1 + 연 수익률)<sup>1/12</sup> − 1<br />월말 자산 = 월초 자산 × (1 + 월 수익률) + 월 적립액 + 일회성 자금</div></section>
        <section><h2>5. 수익률 가정</h2><p>연 수익률은 -20%부터 30% 사이에서 월 수익률로 바꿔 적용합니다. 화면의 0%, 2%, 4%, 6% 선택지는 추천값이 아니라 결과가 가정에 얼마나 민감한지 보는 예시입니다. 실제 시장 결과의 범위를 보장하지 않습니다.</p></section>
        <section><h2>6. 세 가지 해결책 계산</h2><p>부족분이 있으면 세 가지 산술 해결책을 만듭니다. 첫째는 필요한 금액을 남은 개월 수로 나눠 월 적립액을 높이는 방법, 둘째는 현재 월 적립액을 유지하면서 시작 자금을 보태는 방법, 셋째는 현재 월 적립액을 유지할 때 목표 금액에 도달하는 날짜로 기간을 조정하는 방법입니다. 표시 금액은 실행하기 쉽도록 만 원 단위로 올림합니다.</p><p>이미 목표를 맞출 수 있다면 현재 계획 유지, 월 적립 부담 낮추기, 현재 속도의 예상 도착일 확인으로 바뀝니다. 세 해결책은 금융상품이나 투자전략 추천이 아니라 입력값을 바탕으로 한 계산 예시입니다.</p></section>
        <section><h2>7. 목표 도착일과 자금 부족</h2><p>원하는 날짜의 부족분과 별도로, 현재 계획이 목표 금액에 처음 도달하는 예상 연월도 계산합니다. 큰 지출이나 적자로 잔액이 0원 아래로 내려가면 ‘이 계획을 유지하면 돈이 부족해질 수 있어요’라고 표시하고 부족 금액과 시점을 함께 계산합니다.</p></section>
        <section><h2>8. 계산 범위와 한계</h2><p>최대 계산 기간은 1,200개월, 즉 100년입니다. 세금, 거래 수수료, 물가상승률, 자산별 위험과 수익률 차이는 기본 계산에 포함하지 않습니다. 모든 금융자산에 하나의 혼합 수익률을 적용하기 때문에 실제 금융기관의 결과와 차이가 날 수 있습니다.</p></section>
        <section className="example-box"><span>기억할 점</span><h2>실행안은 약속이 아니라 계획 기준입니다</h2><p>Money GPS의 목적은 미래를 확정하는 것이 아니라, 원하는 날짜에 맞추려면 통제 가능한 금액을 어떻게 바꿔야 하는지 같은 계산 기준으로 보여주는 것입니다.</p><Link className="button button--primary" href="/money-gps">내 해결안 만들기</Link></section>
      </article>
    </main>
  );
}
