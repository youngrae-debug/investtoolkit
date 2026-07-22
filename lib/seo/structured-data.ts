import {
  getGuideModifiedDate,
  getGuidePublishedDate,
  type Guide,
} from "@/content/guides";
import { absoluteUrl, SITE_NAME, SITE_URL, SOCIAL_IMAGE } from "@/lib/seo/site";

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

export const GLOBAL_STRUCTURED_DATA: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "INVETK",
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "목표 금액의 예상 부족분과 해결책, 정책 혜택 가능성을 확인하는 브라우저 기반 도구",
      inLanguage: "ko-KR",
      publisher: { "@id": organizationId },
    },
  ],
};

interface WebPageStructuredDataInput {
  name: string;
  description: string;
  path: string;
}

export function createWebPageStructuredData({
  name,
  description,
  path,
}: WebPageStructuredDataInput): Record<string, unknown> {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name,
    description,
    url,
    inLanguage: "ko-KR",
    isPartOf: { "@id": websiteId },
    about: { "@id": organizationId },
  };
}

interface WebApplicationStructuredDataInput extends WebPageStructuredDataInput {
  features: string[];
}

export function createWebApplicationStructuredData({
  name,
  description,
  path,
  features,
}: WebApplicationStructuredDataInput): Record<string, unknown> {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#application`,
    name,
    description,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and a modern web browser",
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    provider: { "@id": organizationId },
    featureList: features,
  };
}

export function createGuidesCollectionStructuredData(
  guideItems: Guide[],
): Record<string, unknown> {
  const url = absoluteUrl("/guides");

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: "1억 모으기·자산 목표 계산 가이드",
    description:
      "월 적립액, 현재 자산, 지출과 일회성 자금이 목표 날짜에 미치는 영향을 설명하는 계산 가이드",
    url,
    inLanguage: "ko-KR",
    isPartOf: { "@id": websiteId },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: guideItems.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        url: absoluteUrl(`/guides/${guide.slug}`),
      })),
    },
  };
}

export function createGuideStructuredData(guide: Guide): Record<string, unknown> {
  const url = absoluteUrl(`/guides/${guide.slug}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.title,
        description: guide.description,
        url,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        image: SOCIAL_IMAGE.url,
        datePublished: getGuidePublishedDate(guide),
        dateModified: getGuideModifiedDate(guide),
        inLanguage: "ko-KR",
        author: { "@id": organizationId },
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: guide.title,
        description: guide.description,
        url,
        inLanguage: "ko-KR",
        isPartOf: { "@id": websiteId },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: guide.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "가이드",
            item: absoluteUrl("/guides"),
          },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };
}
