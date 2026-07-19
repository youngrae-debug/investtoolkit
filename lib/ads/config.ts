const DEFAULT_ADSENSE_CLIENT_ID = "ca-pub-6841289838521074";
const configuredClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? "";
const guideSlotId = process.env.NEXT_PUBLIC_ADSENSE_GUIDE_SLOT_ID?.trim() ?? "";

export const ADSENSE_CLIENT_ID = /^ca-pub-\d{16}$/.test(configuredClientId)
  ? configuredClientId
  : DEFAULT_ADSENSE_CLIENT_ID;
export const ADSENSE_GUIDE_SLOT_ID = /^\d{10}$/.test(guideSlotId) ? guideSlotId : null;
export const ADSENSE_CONFIGURED = Boolean(ADSENSE_GUIDE_SLOT_ID);
export const ADSENSE_PUBLISHER_ID = ADSENSE_CLIENT_ID.replace(/^ca-/, "");

export const ADSENSE_CONSENT_KEY = "invetk-ads-consent";
export const ADSENSE_CONSENT_EVENT = "invetk:ads-consent-changed";
export const ADSENSE_SCRIPT_ID = "invetk-adsense-script";
