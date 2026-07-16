"use client";

import { ANALYTICS_SETTINGS_EVENT } from "@/lib/analytics/config";

export function AnalyticsSettingsButton() {
  return (
    <button
      className="footer-link-button"
      type="button"
      onClick={() => window.dispatchEvent(new Event(ANALYTICS_SETTINGS_EVENT))}
    >
      분석 설정
    </button>
  );
}
