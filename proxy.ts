import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "invetk.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

export function proxy(request: NextRequest) {
  const url = new URL(request.url);

  if (url.hostname.toLowerCase() !== WWW_HOST) {
    return NextResponse.next();
  }

  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";

  return NextResponse.redirect(url, 308);
}
