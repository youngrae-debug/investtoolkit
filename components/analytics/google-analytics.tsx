"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_SETTINGS_EVENT,
  GOOGLE_ANALYTICS_ID,
} from "@/lib/analytics/config";
import {
  ADSENSE_CONFIGURED,
  ADSENSE_CONSENT_EVENT,
  ADSENSE_CONSENT_KEY,
} from "@/lib/ads/config";

const GOOGLE_TAG_SCRIPT_ID = "invetk-google-tag";

type AnalyticsConsent = "granted" | "denied";
type AdConsent = "granted" | "denied";

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

function readAdConsent(): AdConsent | null {
  const stored = window.localStorage.getItem(ADSENSE_CONSENT_KEY);
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
  const isGuideDetail = pathname.startsWith("/guides/");
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => (
    typeof window === "undefined" ? null : readConsent()
  ));
  const [adConsent, setAdConsent] = useState<AdConsent | null>(() => (
    typeof window === "undefined" ? null : readAdConsent()
  ));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsSelected, setAnalyticsSelected] = useState(() => (
    typeof window !== "undefined" && readConsent() === "granted"
  ));
  const [adsSelected, setAdsSelected] = useState(() => (
    typeof window !== "undefined" && readAdConsent() === "granted"
  ));
  const initializedRef = useRef(false);
  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const openSettings = () => {
      setAnalyticsSelected(readConsent() === "granted");
      setAdsSelected(readAdConsent() === "granted");
      setSettingsOpen(true);
    };
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
      send_to: GOOGLE_ANALYTICS_ID,
    });
  }, [consent, pathname]);

  function chooseConsent(nextConsent: AnalyticsConsent) {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent);
    setConsent(nextConsent);
    setSettingsOpen(false);
  }

  function savePreferences(nextAnalytics: AnalyticsConsent, nextAds: AdConsent) {
    const shouldReload = adConsent === "granted" && nextAds === "denied";

    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextAnalytics);
    window.localStorage.setItem(ADSENSE_CONSENT_KEY, nextAds);
    setConsent(nextAnalytics);
    setAdConsent(nextAds);
    setSettingsOpen(false);
    window.dispatchEvent(new Event(ADSENSE_CONSENT_EVENT));

    // 이미 로드된 광고 런타임을 확실히 제거하기 위해 철회 시 새 문서로 다시 엽니다.
    if (shouldReload) window.location.reload();
  }

  const needsChoice = consent === null
    || (ADSENSE_CONFIGURED && isGuideDetail && adConsent === null);
  const showAdsPreferences = ADSENSE_CONFIGURED && (isGuideDetail || settingsOpen);
  if (!hydrated || (!needsChoice && !settingsOpen)) return null;

  if (showAdsPreferences) {
    return (
      <aside className="analytics-consent" role="region" aria-label="개인정보 선택 설정">
        <div>
          <strong>개인정보 선택 설정</strong>
          <p>
            분석과 가이드 광고는 모두 선택 사항입니다. 광고를 허용해도 개인 맞춤 광고는 요청하지 않으며,
            목표 금액·자산·월급·지출·메모는 보내지 않습니다.
            {" "}<Link href="/privacy">개인정보 처리 방식 보기</Link>
          </p>
          <div className="analytics-consent__choices">
            <label>
              <input
                type="checkbox"
                checked={analyticsSelected}
                onChange={(event) => setAnalyticsSelected(event.target.checked)}
              />
              이용 분석 허용
            </label>
            <label>
              <input
                type="checkbox"
                checked={adsSelected}
                onChange={(event) => setAdsSelected(event.target.checked)}
              />
              가이드 비개인화 광고 허용
            </label>
          </div>
        </div>
        <div className="analytics-consent__actions">
          <button className="button button--quiet" type="button" onClick={() => savePreferences("denied", "denied")}>필수만 사용</button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => savePreferences(analyticsSelected ? "granted" : "denied", adsSelected ? "granted" : "denied")}
          >
            선택 저장
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="analytics-consent" role="region" aria-label="사이트 이용 분석 설정">
      <div>
        <strong>서비스 개선을 위한 이용 분석</strong>
        <p>
          허용하면 방문한 페이지와 이용 흐름만 Google Analytics로 확인합니다.
          목표 금액·자산·월급·지출·메모는 보내지 않습니다.
          {" "}<Link href="/privacy">개인정보 처리 방식 보기</Link>
        </p>
      </div>
      <div className="analytics-consent__actions">
        <button className="button button--quiet" type="button" onClick={() => chooseConsent("denied")}>거부</button>
        <button className="button button--primary" type="button" onClick={() => chooseConsent("granted")}>분석 허용</button>
      </div>
    </aside>
  );
}
