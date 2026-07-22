const isDevelopment = process.env.NODE_ENV === "development";

export function createContentSecurityPolicy({ allowAdSense = false } = {}) {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
    "media-src 'self'",
    "font-src 'self' data:",
    allowAdSense
      ? "img-src 'self' data: blob: https:"
      : "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    allowAdSense
      ? `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https:`
      : `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
    "script-src-attr 'none'",
    allowAdSense
      ? `connect-src 'self'${isDevelopment ? " ws:" : ""} https:`
      : `connect-src 'self'${isDevelopment ? " ws:" : ""} https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com`,
    allowAdSense ? "frame-src https:" : "frame-src 'none'",
    allowAdSense
      ? "worker-src 'self' blob: https:"
      : "worker-src 'self' blob:",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
