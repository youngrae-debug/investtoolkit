import { expect, test } from "@playwright/test";

test("completes the three-question flow and restores a saved plan", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  await page.getByRole("button", { name: "내 목표일 계산하기" }).click();
  await page.getByRole("textbox", { name: "목표 금액", exact: true }).fill("10000");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("textbox", { name: "지금까지 모은 돈", exact: true }).fill("3000");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("textbox", { name: "매달 모을 돈", exact: true }).fill("100");
  await page.getByRole("button", { name: "목표일 확인하기" }).click();

  await expect(page.getByRole("heading", { name: "5년 10개월" })).toBeVisible();
  await expect(page.getByText("예상 도착 연월")).toBeVisible();
  await expect(page.getByText("매달 10만 원 더 모으기", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "계획 저장" }).click();
  await expect(page.getByRole("status")).toContainText("계획을 이 브라우저에 저장했어요");
  await page.reload();
  await expect(page.getByRole("heading", { name: "나의 목표 계획의 경로를 이어볼까요?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이번 달 업데이트" })).toBeVisible();
});
