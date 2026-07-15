import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/content/guides";

export const metadata: Metadata = {
  title: "자산 목표 계산 가이드",
  description: "1억 모으기, 생활비 절약, 보너스와 자동차 구매가 목표일에 미치는 영향을 쉬운 계산 예시로 설명합니다.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <main id="main-content" className="content-page content-page--wide">
      <header className="content-hero">
        <span className="section-kicker">Money GPS 가이드</span>
        <h1>돈에 관한 질문을<br />시간으로 풀어봅니다</h1>
        <p>특정 상품을 추천하지 않고, 원금 기준부터 차근차근 계산합니다.</p>
      </header>
      <div className="guide-grid">
        {guides.map((guide, index) => (
          <article className="guide-card" key={guide.slug}>
            <span>{String(index + 1).padStart(2, "0")} · {guide.eyebrow}</span>
            <h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
            <p>{guide.description}</p>
            <Link className="guide-link" href={`/guides/${guide.slug}`}>가이드 읽기 <span aria-hidden="true">→</span></Link>
          </article>
        ))}
      </div>
    </main>
  );
}

