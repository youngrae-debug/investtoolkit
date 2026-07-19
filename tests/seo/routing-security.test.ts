import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import { proxy } from "../../proxy";
import { createContentSecurityPolicy } from "@/lib/security/csp";

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
    expect(response.headers.get("content-security-policy")).toContain("https://www.googletagmanager.com");
    expect(response.headers.get("content-security-policy")).not.toContain("frame-src https:");
  });
});

describe("security headers", () => {
  it("keeps browser hardening headers on every route", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");
    const rules = await nextConfig.headers?.();
    const securityHeaders = Object.fromEntries((rules?.[0]?.headers ?? []).map(({ key, value }) => [key, value]));

    expect(rules?.map(({ source }) => source)).toEqual(["/", "/:path*"]);
    expect(securityHeaders["Strict-Transport-Security"]).toBe("max-age=31536000");
    expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
    expect(securityHeaders["X-Frame-Options"]).toBe("DENY");
    expect(securityHeaders["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("allows AdSense child resources only in the explicit ad policy", () => {
    const corePolicy = createContentSecurityPolicy();
    const adPolicy = createContentSecurityPolicy({ allowAdSense: true });

    expect(corePolicy).toContain("frame-ancestors 'none'");
    expect(corePolicy).toContain("https://*.google-analytics.com");
    expect(corePolicy).not.toContain("frame-src https:");
    expect(adPolicy).toContain("frame-src https:");
    expect(adPolicy).toContain("script-src 'self' 'unsafe-inline' https:");
  });
});
