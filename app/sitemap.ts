import type { MetadataRoute } from "next";
import { guides } from "@/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://invetk.com";
  const fixed = ["", "/money-gps", "/guides", "/methodology", "/privacy", "/terms", "/about"];
  return [...fixed.map((path) => ({ url: `${base}${path}`, lastModified: new Date("2026-07-15") })), ...guides.map((guide) => ({ url: `${base}/guides/${guide.slug}`, lastModified: new Date("2026-07-15") }))];
}

