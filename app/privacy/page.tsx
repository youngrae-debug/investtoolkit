import { createPageMetadata } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "개인정보처리방침",
  description:
    "INVETK Money GPS의 금융 입력값 브라우저 처리, localStorage 계획 저장, 선택적 이용 분석과 가이드 광고, 백업·삭제 방식을 안내합니다.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <main id="main-content" className="content-page article-page legal-page"><header className="article-header"><span className="section-kicker">개인정보</span><h1>금융 입력값은 브라우저 안에서만 처리합니다</h1><p>기본 계산은 회원가입이나 서버 저장 없이 동작합니다.</p><small>시행일 2026년 7월 19일</small></header><article className="article-body">
    <section><h2>1. 기본 계산</h2><p>목표 금액, 지금까지 모은 돈, 월급, 지출, 대출 상환액, 매달 모을 돈은 계산을 위해 현재 브라우저 메모리에서만 사용합니다. INVETK 서버로 보내거나 URL에 넣지 않습니다.</p></section>
    <section><h2>2. 브라우저 저장</h2><p>사용자가 ‘계획 저장’을 직접 선택한 경우에만 계획 이름, 계산 입력, 수익률 가정, 예상 도착일, 이번 달 실제 저축액과 선택한 변화 이유를 현재 브라우저의 localStorage에 저장합니다. 다른 기기나 브라우저에는 자동으로 동기화되지 않습니다.</p></section>
    <section><h2>3. 저장 이유와 삭제</h2><p>저장 목적은 다음 방문 때 계획을 이어보고 이전 목표일과 비교하기 위함입니다. 결과 화면의 ‘이 브라우저의 저장 데이터 삭제’를 누르거나 브라우저의 사이트 데이터 삭제 기능을 사용하면 제거됩니다.</p></section>
    <section><h2>4. 데이터 백업</h2><p>사용자는 저장된 계획을 파일로 백업하고 다시 불러올 수 있습니다. 백업 파일은 사용자가 직접 보관하며, 파일 공유나 보관 과정은 INVETK가 통제하지 않습니다.</p></section>
    <section><h2>5. 선택적 이용 분석</h2><p>사용자가 ‘이용 분석 허용’을 선택한 경우에만 Google Analytics를 불러옵니다. 방문한 페이지 경로, 페이지 제목, 접속 시각, 기기·브라우저의 일반 정보와 유입 경로를 서비스 개선 목적으로 확인할 수 있습니다. 월급, 자산, 목표 금액, 지출, 적립액, 메모와 전체 계산 결과는 분석 속성에 포함하지 않으며 URL에도 넣지 않습니다.</p><p>거부하면 Google Analytics 태그를 불러오지 않습니다. 선택은 현재 브라우저의 localStorage에 저장됩니다.</p></section>
    <section><h2>6. 선택적 가이드 광고</h2><p>Google AdSense가 설정된 경우에도 광고는 가이드 상세 글에만 수동으로 한 개 배치합니다. 계산기, 정책 혜택, 계산 기준, 개인정보처리방침과 이용약관에는 광고 코드를 넣지 않습니다. 사용자가 ‘가이드 비개인화 광고 허용’을 선택한 뒤에만 광고 스크립트를 불러오며, 모든 광고 요청은 개인 맞춤이 아닌 광고로 설정합니다.</p><p>개인 맞춤이 아닌 광고도 게재빈도 관리와 통합 광고 보고를 위해 쿠키 또는 유사 기술을 사용할 수 있습니다. 목표 금액, 자산, 월급, 지출, 적립액, 메모와 계산 결과를 광고 속성이나 광고 요청에 추가하지 않습니다.</p></section>
    <section><h2>7. 선택 변경과 Google 처리</h2><p>분석과 광고 선택은 페이지 아래 ‘개인정보 설정’에서 언제든 변경할 수 있습니다. 광고 허용을 철회하면 이미 불러온 광고 런타임을 제거하기 위해 페이지를 새로고침합니다. Google의 데이터 처리 방식은 <a href="https://policies.google.com/privacy?hl=ko" target="_blank" rel="noreferrer">Google 개인정보처리방침</a>에서 확인할 수 있습니다.</p></section>
    <section><h2>8. 문의</h2><p>문의 수단이 별도 환경설정으로 제공되는 경우에만 사이트에 연락처를 표시합니다. 현재는 별도의 금융 상담이나 개인정보 접수 창구를 운영하지 않습니다.</p></section>
  </article></main>;
}
