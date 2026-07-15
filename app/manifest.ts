import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "INVETK Money GPS", short_name: "Money GPS", description: "내 자산 목표 도착일 계산기", start_url: "/", display: "standalone", background_color: "#f7f6f0", theme_color: "#087f72", lang: "ko" };
}
