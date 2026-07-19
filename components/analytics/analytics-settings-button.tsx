"use client";

import { ANALYTICS_SETTINGS_EVENT } from "@/lib/analytics/config";
import { ADSENSE_CONFIGURED } from "@/lib/ads/config";

export function AnalyticsSettingsButton() {
  return (
    <button
      className="footer-link-button"
      type="button"
      onClick={() => window.dispatchEvent(new Event(ANALYTICS_SETTINGS_EVENT))}
    >
      {ADSENSE_CONFIGURED ? "개인정보 설정" : "분석 설정"}
    </button>
  );
}
