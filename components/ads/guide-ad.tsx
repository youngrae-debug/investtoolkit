"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_CONFIGURED,
  ADSENSE_CONSENT_EVENT,
  ADSENSE_CONSENT_KEY,
  ADSENSE_GUIDE_SLOT_ID,
  ADSENSE_SCRIPT_ID,
} from "@/lib/ads/config";

type AdConsent = "granted" | "denied";
type AdSenseQueue = Array<Record<string, unknown>> & {
  requestNonPersonalizedAds?: number;
};

const AD_CONTAINER_STYLE = { display: "block" } as const;

declare global {
  interface Window {
    adsbygoogle?: AdSenseQueue;
  }
}

function subscribeToHydration() {
  return () => undefined;
}

function readAdConsent(): AdConsent | null {
  const stored = window.localStorage.getItem(ADSENSE_CONSENT_KEY);
  return stored === "granted" || stored === "denied" ? stored : null;
}

export function GuideAd() {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [consent, setConsent] = useState<AdConsent | null>(() => (
    typeof window === "undefined" ? null : readAdConsent()
  ));
  const requestedRef = useRef(false);

  useEffect(() => {
    const updateConsent = () => setConsent(readAdConsent());
    const updateFromAnotherTab = (event: StorageEvent) => {
      if (event.key === ADSENSE_CONSENT_KEY) updateConsent();
    };

    window.addEventListener(ADSENSE_CONSENT_EVENT, updateConsent);
    window.addEventListener("storage", updateFromAnotherTab);
    return () => {
      window.removeEventListener(ADSENSE_CONSENT_EVENT, updateConsent);
      window.removeEventListener("storage", updateFromAnotherTab);
    };
  }, []);

  useEffect(() => {
    if (!ADSENSE_CONFIGURED || consent !== "granted" || requestedRef.current) return;

    const queue = window.adsbygoogle ?? [];
    queue.requestNonPersonalizedAds = 1;
    window.adsbygoogle = queue;

    if (!document.getElementById(ADSENSE_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      document.head.appendChild(script);
    }

    queue.push({});
    requestedRef.current = true;
  }, [consent]);

  if (!hydrated || !ADSENSE_CONFIGURED || consent !== "granted") return null;

  return (
    <aside className="guide-ad" aria-label="광고">
      <span className="guide-ad__label">광고</span>
      <ins
        className="adsbygoogle"
        style={AD_CONTAINER_STYLE}
        data-ad-client={ADSENSE_CLIENT_ID ?? undefined}
        data-ad-slot={ADSENSE_GUIDE_SLOT_ID ?? undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
