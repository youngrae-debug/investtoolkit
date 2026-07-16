import type { MetadataRoute } from "next";
import { guides } from "@/content/guides";
import { absoluteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: new Date("2026-07-16"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/money-gps"), lastModified: new Date("2026-07-16"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/policy-benefits"), lastModified: new Date("2026-07-16"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/guides"), lastModified: new Date("2026-07-16"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/methodology"), lastModified: new Date("2026-07-16"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/about"), lastModified: new Date("2026-07-16"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), lastModified: new Date("2026-07-15"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: new Date("2026-07-15"), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...fixed,
    ...guides.map((guide) => ({
      url: absoluteUrl(`/guides/${guide.slug}`),
      lastModified: new Date("2026-07-15"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
