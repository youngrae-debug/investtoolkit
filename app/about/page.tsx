import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "INVETK 소개", description: "금액을 시간으로 번역하는 개인 금융 내비게이션 INVETK Money GPS를 소개합니다.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <main id="main-content" className="content-page about-page"><header className="content-hero"><span className="section-kicker">About INVETK</span><h1>돈의 숫자를,<br />삶의 시간으로</h1><p>INVETK는 더 많은 계산기를 만들기보다 한 가지 질문을 제대로 풀고 싶었습니다. “지금의 선택은 내 목표일을 얼마나 바꾸는가?”</p></header><div className="about-grid"><section><span>01</span><h2>금액보다 시간</h2><p>월 20만 원의 차이를 연간 금액으로만 보여주지 않고, 목표일까지 몇 개월을 바꾸는지 계산합니다.</p></section><section><span>02</span><h2>추천보다 비교</h2><p>특정 상품이나 종목을 추천하지 않습니다. 같은 계산 기준으로 여러 선택의 시간 차이를 비교합니다.</p></section><section><span>03</span><h2>한 번보다 계속</h2><p>계획을 브라우저에 저장하고 다음 달 자산을 업데이트해, 목표일이 어떻게 움직였는지 확인합니다.</p></section></div><div className="about-principles"><h2>우리가 지키는 원칙</h2><ul><li>가입 없이 기본 계산</li><li>금융 입력을 서버로 보내지 않기</li><li>계산 방식과 가정 공개</li><li>수익 보장 표현 사용하지 않기</li><li>사용자가 통제할 수 있는 변수를 먼저 보여주기</li></ul><Link className="button button--primary" href="/money-gps">내 목표일 계산하기</Link></div></main>;
}

