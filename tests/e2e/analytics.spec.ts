import { expect, test } from "@playwright/test";

test("loads Google Analytics only after consent and allows the choice to change", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/gtag/js**", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: "" });
  });

  await page.goto("/");

  const settings = page.getByRole("region", { name: "사이트 이용 분석 설정" });
  await expect(settings).toBeVisible();
  await expect(page.locator("#invetk-google-tag")).toHaveCount(0);

  await page.getByRole("button", { name: "거부", exact: true }).click();
  await expect(settings).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("invetk-analytics-consent"))).toBe("denied");

  await page.getByRole("button", { name: "분석 설정", exact: true }).click();
  await expect(settings).toBeVisible();
  await page.getByRole("button", { name: "분석 허용", exact: true }).click();

  await expect(page.locator("#invetk-google-tag")).toHaveAttribute("src", /G-PQ2T0TH6JX/);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("invetk-analytics-consent"))).toBe("granted");
  await expect.poll(() => page.evaluate(() => {
    const dataLayer = (window as typeof window & { dataLayer?: Array<unknown> }).dataLayer ?? [];
    return dataLayer.length;
  })).toBeGreaterThan(1);
});
