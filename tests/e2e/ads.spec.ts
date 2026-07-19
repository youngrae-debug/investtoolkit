import { expect, test } from "@playwright/test";

const adsConfigured = /^ca-pub-\d{16}$/.test(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "")
  && /^\d{10}$/.test(process.env.NEXT_PUBLIC_ADSENSE_GUIDE_SLOT_ID ?? "");

test("renders the guide comparison and checklist without page overflow", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("invetk-analytics-consent", "denied");
    window.localStorage.setItem("invetk-ads-consent", "denied");
  });
  await page.goto("/guides/monthly-500k-to-100m");

  await expect(page.getByRole("heading", { name: "출발 자산과 월 적립액을 함께 비교하면" })).toBeVisible();
  await expect(page.locator(".guide-comparison tbody tr")).toHaveCount(3);
  await expect(page.locator(".guide-checklist li")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("never places AdSense code on the calculator or policy-benefit routes", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("invetk-analytics-consent", "denied");
  });
  await page.route("https://pagead2.googlesyndication.com/**", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: "" });
  });

  for (const path of ["/money-gps", "/policy-benefits"]) {
    await page.goto(path);
    await expect(page.locator("#invetk-adsense-script")).toHaveCount(0);
    await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "가이드 비개인화 광고 허용" })).toHaveCount(0);
  }
});

test("keeps guide ads inactive when publisher configuration is missing", async ({ page }) => {
  test.skip(adsConfigured, "AdSense test configuration is active.");

  await page.addInitScript(() => {
    window.localStorage.setItem("invetk-ads-consent", "granted");
    window.localStorage.setItem("invetk-analytics-consent", "denied");
  });
  await page.goto("/guides/monthly-500k-to-100m");

  await expect(page.locator("#invetk-adsense-script")).toHaveCount(0);
  await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveCount(0);
});

test("loads one non-personalized responsive ad only after explicit consent", async ({ page }) => {
  test.skip(!adsConfigured, "Requires test AdSense publisher and slot IDs.");
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID!;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_GUIDE_SLOT_ID!;

  await page.route("https://pagead2.googlesyndication.com/**", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: "" });
  });
  await page.goto("/guides/monthly-500k-to-100m");

  await expect(page.locator("#invetk-adsense-script")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "가이드 비개인화 광고 허용" }).check();
  await page.getByRole("button", { name: "선택 저장", exact: true }).click();

  const ad = page.locator("ins.adsbygoogle");
  await expect(ad).toHaveCount(1);
  await expect(ad).toHaveAttribute("data-ad-client", clientId);
  await expect(ad).toHaveAttribute("data-ad-slot", slotId);
  await expect(ad).toHaveAttribute("data-ad-format", "auto");
  await expect(ad).toHaveAttribute("data-full-width-responsive", "true");
  await expect(page.locator("#invetk-adsense-script")).toHaveAttribute("src", new RegExp(clientId));
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute("content", clientId);
  await expect.poll(() => page.evaluate(() => window.adsbygoogle?.requestNonPersonalizedAds)).toBe(1);

  const adsText = await page.request.get("/ads.txt");
  expect(adsText.status()).toBe(200);
  expect(await adsText.text()).toBe(`google.com, ${clientId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
});
