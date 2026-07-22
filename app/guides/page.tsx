import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { guides } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo/site";
import { createGuidesCollectionStructuredData } from "@/lib/seo/structured-data";

const title = "1억 모으기·자산 목표 계산 가이드";
const description =
  "월 적립액으로 1억 모으는 기간, 돈 목표 계산기 사용법, 수익률 0% 기준과 생활비·보너스·자동차 구매가 목표일에 미치는 영향을 설명합니다.";

export const metadata = createPageMetadata({ title, description, path: "/guides" });

const structuredData = createGuidesCollectionStructuredData(guides);

export default function GuidesPage() {
  return (
    <main id="main-content" className="content-page content-page--wide">
      <JsonLd data={structuredData} />
      <header className="content-hero">
        <span className="section-kicker">Money GPS 가이드</span>
        <h1>돈에 관한 질문을<br />시간으로 풀어봅니다</h1>
        <p>내 숫자로 직접 확인할 수 있도록 원금 기준과 실제 계산 예시부터 설명합니다.</p>
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
