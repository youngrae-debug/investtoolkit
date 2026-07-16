import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <main id="main-content" className="not-found"><span className="section-kicker">경로를 벗어났어요</span><h1>404</h1><p>찾는 페이지가 없거나 주소가 바뀌었습니다.</p><div><Link className="button button--primary" href="/">홈으로 돌아가기</Link><Link className="button button--quiet" href="/money-gps">목표일 계산하기</Link></div></main>;
}
