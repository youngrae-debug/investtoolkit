import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import { proxy } from "../../proxy";

describe("canonical host routing", () => {
  it("redirects www requests permanently while preserving path and query", () => {
    const response = proxy(new NextRequest("https://www.invetk.com/guides?utm_source=test"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://invetk.com/guides?utm_source=test");
  });

  it("allows canonical-host requests to continue", () => {
    const response = proxy(new NextRequest("https://invetk.com/money-gps"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("security headers", () => {
  it("sets browser hardening headers without blocking Google Analytics", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");
    const rules = await nextConfig.headers?.();
    const headers = Object.fromEntries((rules?.[0]?.headers ?? []).map(({ key, value }) => [key, value]));

    expect(rules?.map(({ source }) => source)).toEqual(["/", "/:path*"]);
    expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).toContain("https://www.googletagmanager.com");
    expect(headers["Content-Security-Policy"]).toContain("https://*.google-analytics.com");
  });
});
