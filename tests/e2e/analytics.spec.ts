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

test("sends calculator milestones through gtag without financial values", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/gtag/js**", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: "" });
  });

  await page.goto("/money-gps");
  await page.getByRole("button", { name: "분석 허용", exact: true }).click();
  await page.getByRole("textbox", { name: "목표 금액", exact: true }).fill("10000");
  await page.getByRole("button", { name: "5년 후", exact: true }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("textbox", { name: "지금까지 모은 돈", exact: true }).fill("3000");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("textbox", { name: "매달 모을 돈", exact: true }).fill("100");
  await page.getByRole("button", { name: "부족분과 해결안 보기", exact: true }).click();

  const completionParameters = await page.evaluate(() => {
    const dataLayer = (window as typeof window & { dataLayer?: Array<IArguments> }).dataLayer ?? [];
    const completionEvent = dataLayer
      .map((entry) => Array.from(entry as IArguments))
      .find(([command, eventName]) => command === "event" && eventName === "gps_calculation_completed");

    return completionEvent?.[2] ?? null;
  });

  expect(completionParameters).toEqual({
    page_path: "/money-gps",
    result_status: "calculated",
  });
});
