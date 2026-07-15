import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보처리방침", description: "INVETK Money GPS의 브라우저 계산과 로컬 데이터 저장 방식을 안내합니다.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <main id="main-content" className="content-page article-page legal-page"><header className="article-header"><span className="section-kicker">개인정보</span><h1>금융 입력값은 브라우저 안에서만 처리합니다</h1><p>기본 계산은 회원가입이나 서버 저장 없이 동작합니다.</p><small>시행일 2026년 7월 15일</small></header><article className="article-body">
    <section><h2>1. 기본 계산</h2><p>목표 금액, 지금까지 모은 돈, 월급, 지출, 대출 상환액, 매달 모을 돈은 계산을 위해 현재 브라우저 메모리에서만 사용합니다. INVETK 서버로 보내거나 URL에 넣지 않습니다.</p></section>
    <section><h2>2. 브라우저 저장</h2><p>사용자가 ‘계획 저장’을 직접 선택한 경우에만 계획 이름, 계산 입력, 수익률 가정, 예상 도착일, 이번 달 업데이트 기록과 메모를 현재 브라우저의 localStorage에 저장합니다. 다른 기기나 브라우저에는 자동으로 동기화되지 않습니다.</p></section>
    <section><h2>3. 저장 이유와 삭제</h2><p>저장 목적은 다음 방문 때 계획을 이어보고 이전 목표일과 비교하기 위함입니다. 결과 화면의 ‘이 브라우저의 저장 데이터 삭제’를 누르거나 브라우저의 사이트 데이터 삭제 기능을 사용하면 제거됩니다.</p></section>
    <section><h2>4. 데이터 백업</h2><p>사용자는 저장된 계획을 파일로 백업하고 다시 불러올 수 있습니다. 백업 파일은 사용자가 직접 보관하며, 파일 공유나 보관 과정은 INVETK가 통제하지 않습니다.</p></section>
    <section><h2>5. 선택적 분석</h2><p>향후 서비스 개선을 위해 페이지 경로, 단계 번호, 기능 사용 여부 같은 비민감 이벤트를 수집할 수 있습니다. 월급, 자산, 목표 금액, 지출, 적립액, 메모와 전체 계산 결과는 분석 속성에 포함하지 않습니다.</p></section>
    <section><h2>6. 문의</h2><p>문의 수단이 별도 환경설정으로 제공되는 경우에만 사이트에 연락처를 표시합니다. 현재는 별도의 금융 상담이나 개인정보 접수 창구를 운영하지 않습니다.</p></section>
  </article></main>;
}

