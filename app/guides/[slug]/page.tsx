import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getGuide, guides } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo/site";
import { createGuideStructuredData } from "@/lib/seo/structured-data";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return createPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    article: {
      publishedTime: "2026-07-15",
      modifiedTime: "2026-07-15",
    },
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const structuredData = createGuideStructuredData(guide);

  return (
    <main id="main-content" className="content-page article-page">
      <JsonLd data={structuredData} />
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/guides">가이드</Link><span>/</span><span>{guide.title}</span></nav>
      <header className="article-header">
        <span className="section-kicker">{guide.eyebrow}</span>
        <h1>{guide.title}</h1>
        <p>{guide.intro}</p>
        <small>최종 업데이트 2026년 7월 15일 · 약 6분</small>
      </header>
      <article className="article-body">
        <section className="example-box"><span>계산 예시</span><h2>{guide.exampleTitle}</h2><p>{guide.example}</p></section>
        {guide.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
        <section><h2>자주 묻는 질문</h2><div className="faq-list">{guide.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>
        <div className="article-cta"><span>내 숫자로 확인하기</span><h2>세 가지 금액만 입력해 보세요</h2><p>첫 결과는 수익률 0% 원금 기준으로 계산합니다.</p><Link className="button button--primary" href={guide.preset}>내 목표일 계산하기</Link></div>
        <p className="article-disclaimer">이 글의 계산은 이해를 돕기 위한 예시이며 금융상품이나 투자 행동을 추천하지 않습니다. 실제 세금, 수수료, 물가와 시장 수익률은 다를 수 있습니다. <Link href="/methodology">계산 기준 자세히 보기</Link></p>
      </article>
    </main>
  );
}
