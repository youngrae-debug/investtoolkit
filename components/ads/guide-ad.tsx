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
  const [nearViewport, setNearViewport] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
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
    if (!ADSENSE_CONFIGURED || consent !== "granted") return;

    const container = containerRef.current;
    if (!container || !("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(container);
    return () => observer.disconnect();
  }, [consent]);

  useEffect(() => {
    if (!ADSENSE_CONFIGURED || consent !== "granted" || !nearViewport || requestedRef.current) return;

    const queue = window.adsbygoogle ?? [];
    queue.requestNonPersonalizedAds = 1;
    window.adsbygoogle = queue;

    if (!document.getElementById(ADSENSE_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "strict-origin-when-cross-origin";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      document.head.appendChild(script);
    }

    queue.push({});
    requestedRef.current = true;
  }, [consent, nearViewport]);

  if (!hydrated || !ADSENSE_CONFIGURED || consent !== "granted") return null;

  return (
    <aside ref={containerRef} className="guide-ad" aria-label="광고">
      <span className="guide-ad__label">광고</span>
      {nearViewport && (
        <ins
          className="adsbygoogle"
          style={AD_CONTAINER_STYLE}
          data-ad-client={ADSENSE_CLIENT_ID ?? undefined}
          data-ad-slot={ADSENSE_GUIDE_SLOT_ID ?? undefined}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </aside>
  );
}
