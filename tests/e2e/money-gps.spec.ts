import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("invetk-analytics-consent", "denied");
  });
});

function futureTargetMonth(years = 5): string {
  const now = new Date();
  return `${now.getFullYear() + years}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function reachMonthlyStep(
  page: Page,
  { goal = "10000", current = "3000" }: { goal?: string; current?: string } = {},
) {
  await page.goto("/money-gps");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  await page.getByRole("textbox", { name: "목표 금액", exact: true }).fill(goal);
  await page.locator("#goal-date").fill(futureTargetMonth());
  await page.getByRole("button", { name: "다음" }).click();
  const currentAmountHeading = page.getByRole("heading", { name: "지금까지 모은 돈은 얼마인가요?" });
  await expect(currentAmountHeading).toBeFocused();
  await expect(currentAmountHeading).toBeInViewport();
  await page.getByRole("textbox", { name: "지금까지 모은 돈", exact: true }).fill(current);
  await page.getByRole("button", { name: "다음" }).click();
  const monthlyAmountHeading = page.getByRole("heading", { name: "매달 얼마를 모을 수 있나요?" });
  await expect(monthlyAmountHeading).toBeFocused();
  await expect(monthlyAmountHeading).toBeInViewport();
}

async function createResult(
  page: Page,
  values: { goal?: string; current?: string; monthly?: string } = {},
) {
  await reachMonthlyStep(page, values);
  await page.getByRole("textbox", { name: "매달 모을 돈", exact: true }).fill(values.monthly ?? "100");
  await page.getByRole("button", { name: "부족분과 해결안 보기" }).click();
}

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
  await expect(page.getByRole("table", { name: "세 가지 실행안 핵심 비교" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "매달 나눠 채우기" })).toBeVisible();
  await expect(page.getByText("117만 원", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "먼저 실행 방법을 선택해 주세요" })).toBeVisible();
  await expect(page.getByText("추천값을 미리 선택하지 않았어요")).toBeVisible();

  await page.getByRole("button", { name: /매달 10만 원 더 모으기/ }).click();
  await expect(page.locator(".comparison-card").filter({ hasText: "매달 10만 원 더 모으기" })).toContainText("부족분 600만 원 감소");

  const balancedPlan = page.getByRole("article", { name: /월 적립과 시작 자금 나눠 채우기/ });
  await expect(balancedPlan).toContainText("109만 원");
  await expect(balancedPlan).toContainText("500만 원");
  await balancedPlan.getByRole("button", { name: "이 방법으로 계획 보기" }).click();
  await page.getByRole("link", { name: "이번 달 행동 보기" }).click();
  await expect(page.getByRole("heading", { name: "이번 달은 이렇게 시작하세요" })).toBeInViewport();
  await expect(page.locator("#monthly-action")).toContainText("월 자동이체를 109만 원으로 설정하기");
  await expect(page.locator("#monthly-action")).toContainText("시작 자금 500만 원 보태기");
  await page.getByRole("checkbox", { name: "오늘 행동 완료 표시" }).check();
  await expect(page.locator("#monthly-action")).toContainText("1/3 완료");

  await page.getByRole("button", { name: "계획 저장" }).click();
  await expect(page.locator(".toast")).toContainText("계획을 이 브라우저에 저장했어요");
  await expect(page.getByRole("button", { name: "저장됨" })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { name: "나의 목표 계획의 경로를 이어볼까요?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이번 달 업데이트" })).toBeVisible();
  await page.getByRole("button", { name: "이번 달 업데이트" }).click();
  await expect(page.getByRole("heading", { name: "이번 달 얼마 모았나요?" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "이번 달 얼마 모았나요?" })).toBeInViewport();
  await expect(page.getByRole("textbox", { name: "이번 달 실제로 모은 돈", exact: true })).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "계획 다시 보기" }).click();
  await expect(page.getByRole("article", { name: /월 적립과 시작 자금 나눠 채우기, 선택됨/ })).toBeVisible();
  await expect(page.locator("#monthly-action")).toContainText("1/3 완료");

  await page.getByText("내가 가능한 범위로 실행안 맞추기").click();
  await page.getByRole("textbox", { name: "매달 추가로 가능한 최대 금액", exact: true }).fill("10");
  await page.getByRole("textbox", { name: "지금 사용할 수 있는 여유자금", exact: true }).fill("500");
  await page.getByRole("button", { name: "가능 범위로 다시 계산" }).click();
  await expect(page.getByRole("heading", { name: "목표 날짜 조정하기" })).toBeVisible();
  await expect(page.getByRole("article", { name: /매달 가능한 만큼 채우기/ })).toContainText("목표일에 400만 원 부족");
  await expect(page.getByRole("article", { name: /가능 범위 함께 쓰기/ })).toContainText("목표 금액 도달");
});

test("requires saving plan changes before a monthly update", async ({ page }) => {
  await createResult(page);
  await page.getByRole("article", { name: /월 적립과 시작 자금 나눠 채우기/ }).getByRole("button").click();
  await page.getByRole("button", { name: "계획 저장" }).click();

  await page.getByRole("article", { name: /매달 나눠 채우기/ }).getByRole("button").click();
  await expect(page.locator("#monthly-update")).toContainText("화면의 계획이 마지막 저장본과 달라요");
  await expect(page.getByRole("textbox", { name: "이번 달 실제로 모은 돈", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "변경 먼저 저장" }).click();
  await expect(page.getByRole("heading", { name: "선택한 실행 계획을 저장할까요?" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "선택한 실행 계획을 저장할까요?" })).toBeInViewport();
  await expect(page.locator(".toast")).toContainText("변경 내용을 먼저 저장한 뒤 이번 달 기록을 남겨 주세요");
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

test("updates a saved limited plan and records the shortage change", async ({ page }) => {
  await createResult(page);

  await page.getByText("내가 가능한 범위로 실행안 맞추기").click();
  await page.getByRole("textbox", { name: "매달 추가로 가능한 최대 금액", exact: true }).fill("10");
  await page.getByRole("textbox", { name: "지금 사용할 수 있는 여유자금", exact: true }).fill("500");
  await page.getByRole("button", { name: "가능 범위로 다시 계산" }).click();
  await page.getByRole("article", { name: /매달 가능한 만큼 채우기/ }).getByRole("button").click();
  await page.getByRole("button", { name: "계획 저장" }).click();

  await page.getByRole("button", { name: "기록하기" }).click();
  await expect(page.locator(".toast")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.getByRole("textbox", { name: "이번 달 실제로 모은 돈", exact: true }).fill("210");
  await page.getByRole("button", { name: "수입이 달라졌어요" }).click();
  await page.getByRole("button", { name: "이번 달 기록 저장" }).click();

  await expect(page.locator(".toast")).toContainText("계획보다 100만 원 더 모았어요");
  await expect(page.locator(".toast")).toContainText("예상 부족분이 100만 원 줄었어요");
  await expect(page.locator(".checkin-list")).toContainText("계획 110만 원 · 실제 210만 원");
  await expect(page.locator(".checkin-list")).toContainText("수입이 달라졌어요");
  await expect(page.getByRole("heading", { name: "이번 달 얼마 모았나요?" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "이번 달 얼마 모았나요?" })).toBeInViewport();
});

test("exports a saved plan and restores the backup", async ({ page }, testInfo) => {
  await createResult(page);
  await expect(page.getByRole("button", { name: "Choose File" })).toHaveCount(0);
  await page.getByRole("article", { name: /월 적립과 시작 자금 나눠 채우기/ }).getByRole("button").click();
  await page.getByRole("button", { name: "계획 저장" }).click();

  await page.getByText("공유와 데이터 관리").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "데이터 백업" }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath("money-gps-backup.json");
  await download.saveAs(backupPath);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "이 브라우저의 저장 데이터 삭제" }).click();
  await page.goto("/");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "백업 불러오기" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(backupPath);
  await expect(page.locator(".toast")).toContainText("백업을 불러왔어요");

  await page.getByRole("button", { name: "계획 다시 보기" }).click();
  await expect(page.locator(".core-inputs")).toContainText("3,000만 원");
});

test("keeps monthly updates aligned with the currently displayed action", async ({ page }) => {
  await createResult(page);
  await page.getByRole("article", { name: /매달 나눠 채우기/ }).getByRole("button").click();
  await page.getByRole("button", { name: "계획 저장" }).click();

  await page.getByRole("button", { name: "기록하기" }).click();
  await page.getByRole("textbox", { name: "이번 달 실제로 모은 돈", exact: true }).fill("115");
  await page.getByRole("button", { name: "이번 달 기록 저장" }).click();
  await expect(page.locator(".solution-card--selected")).toContainText("115만 원");

  await page.getByRole("button", { name: "기록 수정" }).click();
  await expect(page.locator("#monthly-update")).not.toContainText("첫 기록이라 시작 자금");
  await page.getByRole("button", { name: "이번 달 기록 수정" }).press("Enter");
  const savedState = await page.evaluate(() => {
    const raw = window.localStorage.getItem("invetk-money-gps");
    return raw ? JSON.parse(raw) : null;
  });
  expect(savedState.actionPlan.monthlyContribution).toBe(1_150_000);
  expect(savedState.checkins).toHaveLength(1);
});

test("moves focus into the cashflow helper and restores it on Escape", async ({ page }) => {
  await reachMonthlyStep(page);
  const helperTrigger = page.getByRole("button", { name: /월 적립액을 잘 모르겠어요/ });
  await helperTrigger.click();

  await expect(page.getByRole("textbox", { name: "한 달 실수령액은 얼마인가요?", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(helperTrigger).toBeFocused();
});

test("keeps a negative cashflow visible and warns about insufficient funds", async ({ page }) => {
  await reachMonthlyStep(page, { current: "1000" });
  await page.getByRole("button", { name: /월 적립액을 잘 모르겠어요/ }).click();

  await page.getByRole("textbox", { name: "한 달 실수령액은 얼마인가요?", exact: true }).fill("250");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("textbox", { name: "한 달 고정비는 얼마인가요?", exact: true }).fill("150");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("textbox", { name: "한 달 생활비는 얼마인가요?", exact: true }).fill("150");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "매달 모을 돈 계산" }).click();

  await expect(page.locator(".flow-summary")).toContainText("-50만 원");
  await page.getByRole("button", { name: "부족분과 해결안 보기" }).click();
  await expect(page.getByText("이 계획을 유지하면 돈이 부족해질 수 있어요").last()).toBeVisible();
  await expect(page.locator(".core-inputs .negative")).toHaveText("-50만 원");
});

test("shows an on-track result and recalculates when the return assumption changes", async ({ page }) => {
  await createResult(page, { monthly: "150" });
  await expect(page.getByRole("heading", { name: "2,000만 원 여유" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "현재 계획을 활용하는 세 가지 방법" })).toBeVisible();

  await page.getByText("수익률 가정 적용하기").click();
  await page.getByRole("button", { name: "연 4%" }).click();
  await expect(page.locator(".result-route-label")).toContainText("연 4% 계산 가정");
  await expect(page.locator("#calculator-title")).not.toHaveText("2,000만 원 여유");
});

test("finds a policy benefit and calculates only a confirmed support amount", async ({ page }) => {
  await createResult(page);

  await page.getByRole("button", { name: "내 혜택 가능성 확인" }).click();
  await expect(page.locator("#policy-age")).toHaveAccessibleName("현재 만 나이");
  await expect(page.locator("#policy-age")).toHaveAccessibleDescription("병역이행기간은 공식 심사에서 별도로 확인해요.");
  await page.locator("#policy-age").fill("29");
  await page.getByRole("combobox", { name: "지난해 소득 형태" }).selectOption("salary");
  await page.getByRole("textbox", { name: "지난해 총급여", exact: true }).fill("3600");
  await page.getByRole("combobox", { name: "함께 심사되는 가구원 수" }).selectOption("1");
  await page.getByRole("textbox", { name: "가구원의 지난해 세전 소득 합계", exact: true }).fill("3600");
  await page.getByRole("combobox", { name: "가구의 복지 자격" }).selectOption("other");
  await page.getByRole("button", { name: "가능한 정책 확인" }).click();

  const youthPolicy = page.getByRole("article").filter({ hasText: "청년미래적금" });
  await expect(youthPolicy).toContainText("대상 가능성 있음");
  await expect(youthPolicy).toContainText("2026년 첫 신청 종료");
  await youthPolicy.getByRole("button", { name: "목표 영향 계산" }).click();

  await page.getByRole("textbox", { name: "확인한 월 지원액", exact: true }).fill("10");
  await page.getByRole("checkbox", { name: "공식 안내에서 지원액과 지원 기간을 확인했습니다." }).check();
  await expect(page.locator(".policy-impact-result__lead")).toContainText("부족분이 360만 원 줄어요");
  await expect(page.locator(".policy-impact-grid")).toContainText("목표일까지 지원금 원금360만 원");
});

test("opens policy benefits from its own menu and removes the duplicate comparison menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await expect(page.getByRole("link", { name: "정책 혜택", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "선택 비교" })).toHaveCount(0);
  await page.getByRole("link", { name: "정책 혜택", exact: true }).click();

  await expect(page.getByRole("heading", { name: /놓치고 있던 정책 혜택까지/ })).toBeVisible();
  await expect(page.getByRole("group", { name: "간단한 조건 확인" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "함께 심사되는 가구원 수" })).toBeVisible();
});

test("keeps the backup control readable on the dark calculator preview", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();

  const backupButton = page.getByRole("button", { name: "백업 불러오기" });
  await expect(backupButton).toBeEnabled();
  await expect(backupButton).toHaveCSS("color", "rgb(16, 47, 54)");
});
