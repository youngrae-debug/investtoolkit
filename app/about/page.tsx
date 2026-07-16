import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "INVETK 소개", description: "목표 부족분을 진단하고 세 가지 해결책과 놓치기 쉬운 정책 혜택을 함께 찾는 돈 목표 해결 도구 INVETK를 소개합니다.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <main id="main-content" className="content-page about-page"><header className="content-hero"><span className="section-kicker">About INVETK</span><h1>진단에서 끝내지 않고,<br />목표를 해결하도록</h1><p>INVETK는 한 가지 질문을 제대로 풀고 싶었습니다. “5년 안에 1억, 지금 계획으로 가능한가?”</p></header><div className="about-grid"><section><span>01</span><h2>충족률과 부족분 진단</h2><p>원하는 목표 금액과 날짜를 기준으로 지금 계획의 예상 목표 충족률과 부족분을 계산합니다.</p></section><section><span>02</span><h2>세 가지 해결책과 정책 기회</h2><p>월 적립, 목돈, 기간 조정을 비교하고 놓치기 쉬운 정책형 적금과 지원 통장의 대상 가능성도 확인합니다.</p></section><section><span>03</span><h2>이번 달부터 실행</h2><p>선택한 해결책을 자동이체, 시작 자금 또는 날짜 조정, 월말 확인으로 이어지는 이번 달 계획으로 바꿉니다.</p></section></div><div className="about-principles"><h2>우리가 지키는 원칙</h2><ul><li>가입 없이 기본 계산</li><li>금융 입력을 서버로 보내지 않기</li><li>계산 방식과 가정 공개</li><li>정책 정보에 공식 출처와 확인일 표시</li><li>상품 가입이나 수익을 대신 판단하지 않기</li><li>사용자가 통제할 수 있는 변수를 먼저 보여주기</li></ul><Link className="button button--primary" href="/money-gps">내 해결안 만들기</Link></div></main>;
}
