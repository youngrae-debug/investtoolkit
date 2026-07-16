import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { guides } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo/site";
import { createGuidesCollectionStructuredData } from "@/lib/seo/structured-data";

const title = "1억 모으기·자산 목표 계산 가이드";
const description =
  "월 50만 원·100만 원으로 1억 모으는 기간과 현재 자산, 생활비 절약, 보너스, 자동차 구매가 목표일에 미치는 영향을 계산합니다.";

export const metadata = createPageMetadata({ title, description, path: "/guides" });

const structuredData = createGuidesCollectionStructuredData(guides);

export default function GuidesPage() {
  return (
    <main id="main-content" className="content-page content-page--wide">
      <JsonLd data={structuredData} />
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
