import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { guides } from "@/content/guides";
import {
  absoluteUrl,
  createPageMetadata,
  DEFAULT_DESCRIPTION,
  SITE_URL,
  SOCIAL_IMAGE,
} from "@/lib/seo/site";
import {
  createGuideStructuredData,
  createGuidesCollectionStructuredData,
  GLOBAL_STRUCTURED_DATA,
} from "@/lib/seo/structured-data";

describe("page metadata", () => {
  it("uses an absolute canonical and page-specific social metadata", () => {
    const metadata = createPageMetadata({
      title: "정책 혜택 찾기",
      description: "페이지 설명",
      path: "/policy-benefits",
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "https://invetk.com/policy-benefits",
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      title: "정책 혜택 찾기 | INVETK",
      description: "페이지 설명",
      url: "https://invetk.com/policy-benefits",
      images: [SOCIAL_IMAGE],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "정책 혜택 찾기 | INVETK",
      description: "페이지 설명",
    });
  });

  it("marks guide metadata as an article with publication dates", () => {
    const metadata = createPageMetadata({
      title: guides[0].title,
      description: guides[0].description,
      path: `/guides/${guides[0].slug}`,
      article: {
        publishedTime: "2026-07-15",
        modifiedTime: "2026-07-15",
      },
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-07-15",
      modifiedTime: "2026-07-15",
    });
  });
});

describe("structured data", () => {
  it("defines the site publisher and website once at the root", () => {
    const graph = GLOBAL_STRUCTURED_DATA["@graph"] as Array<Record<string, unknown>>;

    expect(graph.map((item) => item["@type"])).toEqual(["Organization", "WebSite"]);
    expect(graph[1]).toMatchObject({
      name: "INVETK Money GPS",
      url: SITE_URL,
      inLanguage: "ko-KR",
    });
  });

  it("connects every guide to an item list", () => {
    const collection = createGuidesCollectionStructuredData(guides);
    const itemList = collection.mainEntity as Record<string, unknown>;
    const items = itemList.itemListElement as Array<Record<string, unknown>>;

    expect(items).toHaveLength(guides.length);
    expect(items[0]).toMatchObject({
      position: 1,
      name: guides[0].title,
      url: absoluteUrl(`/guides/${guides[0].slug}`),
    });
  });

  it("includes article, FAQ, webpage, and breadcrumb entities for a guide", () => {
    const data = createGuideStructuredData(guides[0]);
    const graph = data["@graph"] as Array<Record<string, unknown>>;

    expect(graph.map((item) => item["@type"])).toEqual([
      "Article",
      "WebPage",
      "FAQPage",
      "BreadcrumbList",
    ]);
    expect(graph.find((item) => item["@type"] === "FAQPage")).toMatchObject({
      mainEntity: expect.arrayContaining([
        expect.objectContaining({ name: guides[0].faq[0].question }),
      ]),
    });
  });
});

describe("crawler discovery files", () => {
  it("publishes each fixed route and guide once in the sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(entries).toHaveLength(8 + guides.length);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(absoluteUrl("/policy-benefits"));
    for (const guide of guides) {
      expect(urls).toContain(absoluteUrl(`/guides/${guide.slug}`));
    }
  });

  it("points crawlers at the canonical host and sitemap", () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/" },
      host: SITE_URL,
      sitemap: absoluteUrl("/sitemap.xml"),
    });
  });

  it("keeps the install manifest aligned with the site identity", () => {
    expect(manifest()).toMatchObject({
      name: "INVETK Money GPS",
      description: DEFAULT_DESCRIPTION,
      start_url: "/",
      scope: "/",
      lang: "ko",
      categories: ["finance", "utilities"],
    });
  });
});
