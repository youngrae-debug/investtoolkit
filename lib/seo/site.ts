import type { Metadata } from "next";

export const SITE_URL = "https://invetk.com";
export const SITE_NAME = "INVETK Money GPS";
export const DEFAULT_DESCRIPTION =
  "목표 날짜의 예상 부족분과 세 가지 해결책을 계산하고, 놓치기 쉬운 정책 혜택과 이번 달 실행 계획까지 확인하세요.";
export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/og.png`,
  width: 1732,
  height: 908,
  alt: "INVETK Money GPS — 목표 진단에서 이번 달 실행까지",
};

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  article?: {
    publishedTime: string;
    modifiedTime: string;
  };
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  article,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = `${title} | INVETK`;
  const openGraph: NonNullable<Metadata["openGraph"]> = article
    ? {
        type: "article",
        title: socialTitle,
        description,
        url,
        siteName: SITE_NAME,
        locale: "ko_KR",
        publishedTime: article.publishedTime,
        modifiedTime: article.modifiedTime,
        authors: [SITE_URL],
        images: [SOCIAL_IMAGE],
      }
    : {
        type: "website",
        title: socialTitle,
        description,
        url,
        siteName: SITE_NAME,
        locale: "ko_KR",
        images: [SOCIAL_IMAGE],
      };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
    },
  };
}
