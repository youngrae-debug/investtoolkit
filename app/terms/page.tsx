import { createPageMetadata } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "이용약관과 금융 면책",
  description:
    "INVETK Money GPS 계산 결과의 참고용 성격, 계산 한계와 중요한 금융 결정 전 확인할 유의사항을 안내합니다.",
  path: "/terms",
});

export default function TermsPage() {
  return <main id="main-content" className="content-page article-page legal-page"><header className="article-header"><span className="section-kicker">이용약관 · 금융 면책</span><h1>결과는 계획을 비교하기 위한 참고용 예상치입니다</h1><p>특정 금융상품이나 투자 행동을 권유하지 않습니다.</p><small>시행일 2026년 7월 15일</small></header><article className="article-body">
    <section><h2>1. 서비스의 목적</h2><p>Money GPS는 사용자가 입력한 금액과 가정을 바탕으로 목표 자산까지의 예상 기간과 선택별 시간 차이를 계산하는 정보 도구입니다. 개인 맞춤형 재무설계, 투자자문, 세무 또는 법률 자문이 아닙니다.</p></section>
    <section><h2>2. 결과의 한계</h2><p>실제 수익률, 세금, 수수료, 물가, 소득, 지출, 시장 상황은 계산과 달라질 수 있습니다. 예상 도착일은 확정된 미래 날짜가 아니며, 손실 방지나 목표 달성을 보장하지 않습니다.</p></section>
    <section><h2>3. 사용자의 책임</h2><p>사용자는 입력값과 가정을 직접 검토해야 합니다. 중요한 금융 결정을 내릴 때는 자격을 갖춘 전문가와 실제 금융기관의 조건을 별도로 확인하세요.</p></section>
    <section><h2>4. 금지된 사용</h2><p>서비스를 불법 목적, 타인의 개인정보 침해, 시스템 공격, 결과의 허위 광고나 수익 보장 표현에 사용해서는 안 됩니다.</p></section>
    <section><h2>5. 서비스 변경</h2><p>계산 방식과 기능은 정확성과 사용성을 개선하기 위해 변경될 수 있습니다. 중요한 계산 기준 변경은 계산 기준 페이지와 업데이트 날짜에 반영합니다.</p></section>
  </article></main>;
}
