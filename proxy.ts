import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADSENSE_CONFIGURED } from "@/lib/ads/config";
import { createContentSecurityPolicy } from "@/lib/security/csp";

const CANONICAL_HOST = "invetk.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

export function proxy(request: NextRequest) {
  const url = new URL(request.url);

  if (url.hostname.toLowerCase() === WWW_HOST) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";

    return NextResponse.redirect(url, 308);
  }

  const isGuideDetail = /^\/guides\/[^/]+\/?$/.test(url.pathname);
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    createContentSecurityPolicy({ allowAdSense: ADSENSE_CONFIGURED && isGuideDetail }),
  );

  return response;
}
