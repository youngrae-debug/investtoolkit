"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_SETTINGS_EVENT,
  GOOGLE_ANALYTICS_ID,
} from "@/lib/analytics/config";

const GOOGLE_TAG_SCRIPT_ID = "invetk-google-tag";

type AnalyticsConsent = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: Array<IArguments | Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

function subscribeToHydration() {
  return () => undefined;
}

function readConsent(): AnalyticsConsent | null {
  const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return stored === "granted" || stored === "denied" ? stored : null;
}

function setGoogleAnalyticsDisabled(disabled: boolean) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = disabled;
}

function initializeGoogleTag() {
  window.dataLayer ??= [];
  window.gtag ??= function gtag() {
    // Google의 공식 gtag 스니펫과 같은 arguments 큐 형식을 사용합니다.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ANALYTICS_ID, { send_page_view: false });

  if (!document.getElementById(GOOGLE_TAG_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GOOGLE_TAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => (
    typeof window === "undefined" ? null : readConsent()
  ));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initializedRef = useRef(false);
  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(ANALYTICS_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(ANALYTICS_SETTINGS_EVENT, openSettings);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (consent !== "granted") {
      setGoogleAnalyticsDisabled(true);
      trackedPathRef.current = null;
      return;
    }

    setGoogleAnalyticsDisabled(false);
    if (!initializedRef.current) {
      initializeGoogleTag();
      initializedRef.current = true;
    }
  }, [consent, hydrated]);

  useEffect(() => {
    if (consent !== "granted" || !initializedRef.current) return;
    if (trackedPathRef.current === pathname) return;

    trackedPathRef.current = pathname;
    window.gtag?.("event", "page_view", {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
    });
  }, [consent, pathname]);

  function chooseConsent(nextConsent: AnalyticsConsent) {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent);
    setConsent(nextConsent);
    setSettingsOpen(false);
  }

  if (!hydrated || (consent !== null && !settingsOpen)) return null;

  return (
    <aside className="analytics-consent" role="region" aria-label="사이트 이용 분석 설정">
      <div>
        <strong>서비스 개선을 위한 이용 분석</strong>
        <p>
          허용하면 방문한 페이지와 이용 흐름만 Google Analytics로 확인합니다.
          목표 금액·자산·월급·지출·메모는 보내지 않습니다.
          {" "}<Link href="/privacy">자세히 보기</Link>
        </p>
      </div>
      <div className="analytics-consent__actions">
        <button className="button button--quiet" type="button" onClick={() => chooseConsent("denied")}>거부</button>
        <button className="button button--primary" type="button" onClick={() => chooseConsent("granted")}>분석 허용</button>
      </div>
    </aside>
  );
}
