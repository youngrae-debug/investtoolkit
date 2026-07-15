import { expect, test } from "@playwright/test";

test("creates three goal-date solutions and restores a saved plan", async ({ page }) => {
  const now = new Date();
  const targetMonth = `${now.getFullYear() + 5}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await page.goto("/");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "5년 안에 1억, 지금 계획으로 가능할까요?" })).toBeVisible();
  await page.getByRole("button", { name: "내 해결안 만들기" }).click();
  await page.getByRole("textbox", { name: "목표 금액", exact: true }).fill("10000");
  await expect(page.locator("#goal-amount-readable")).toHaveText("= 1억 원");
  await page.locator("#goal-date").fill(targetMonth);
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("textbox", { name: "지금까지 모은 돈", exact: true }).fill("3000");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("textbox", { name: "매달 모을 돈", exact: true }).fill("100");
  await page.getByRole("button", { name: "부족분과 해결안 보기" }).click();

  await expect(page.getByRole("heading", { name: "1,000만 원 부족" })).toBeVisible();
  await expect(page.locator(".completion-rate")).toContainText("예상 목표 충족률90%");
  await expect(page.getByRole("heading", { name: "부족분을 해결하는 세 가지 방법" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "매달 나눠 채우기" })).toBeVisible();
  await expect(page.getByText("117만 원", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "먼저 실행 방법을 선택해 주세요" })).toBeVisible();
  await expect(page.getByText("추천값을 미리 선택하지 않았어요")).toBeVisible();

  await page.getByRole("button", { name: /매달 10만 원 더 모으기/ }).click();
  await expect(page.locator(".comparison-card").filter({ hasText: "매달 10만 원 더 모으기" })).toContainText("부족분 600만 원 감소");

  const upfrontPlan = page.getByRole("article", { name: /시작 자금으로 채우기/ });
  await upfrontPlan.getByRole("button", { name: "이 방법으로 계획 보기" }).click();
  await expect(page.getByRole("heading", { name: "이번 달은 이렇게 시작하세요" })).toBeVisible();
  await expect(page.locator("#monthly-action")).toContainText("시작 자금 1,000만 원 보태기");
  await page.getByRole("checkbox", { name: "오늘 행동 완료 표시" }).check();
  await expect(page.locator("#monthly-action")).toContainText("1/3 완료");

  await page.getByRole("button", { name: "계획 저장" }).click();
  await expect(page.locator(".toast")).toContainText("계획을 이 브라우저에 저장했어요");
  await page.reload();
  await expect(page.getByRole("heading", { name: "나의 목표 계획의 경로를 이어볼까요?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이번 달 업데이트" })).toBeVisible();
  await page.getByRole("button", { name: "계획 다시 보기" }).click();
  await expect(page.getByRole("article", { name: /시작 자금으로 채우기, 선택됨/ })).toBeVisible();
  await expect(page.locator("#monthly-action")).toContainText("1/3 완료");

  await page.getByText("내가 가능한 범위로 실행안 맞추기").click();
  await page.getByRole("textbox", { name: "매달 추가로 가능한 최대 금액", exact: true }).fill("10");
  await page.getByRole("textbox", { name: "지금 사용할 수 있는 여유자금", exact: true }).fill("500");
  await page.getByRole("button", { name: "가능 범위로 다시 계산" }).click();
  await expect(page.getByRole("heading", { name: "목표 날짜 조정하기" })).toBeVisible();
  await expect(page.getByRole("article", { name: /매달 가능한 만큼 채우기/ })).toContainText("목표일에 400만 원 부족");
});

test("blocks unsafe amount ranges and requires a future target date", async ({ page }) => {
  const now = new Date();
  const pastMonth = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await page.goto("/money-gps");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  const goalInput = page.getByRole("textbox", { name: "목표 금액", exact: true });
  const nextButton = page.getByRole("button", { name: "다음" });

  await goalInput.fill("999999999999999999");
  await expect(page.getByRole("alert")).toContainText("최대 1조 원까지 입력할 수 있어요");
  await expect(nextButton).toBeDisabled();

  await goalInput.fill("10000");
  await page.locator("#goal-date").fill(pastMonth);
  await expect(nextButton).toBeDisabled();
});
