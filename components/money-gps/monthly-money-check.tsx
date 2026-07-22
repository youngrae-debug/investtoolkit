"use client";

import { useState } from "react";
import { formatCurrency, manwonToWon, wonToManwon } from "@/lib/format/currency";
import {
  MONTHLY_CHECKIN_REASONS,
  savingsDifferenceCopy,
} from "@/lib/format/monthly-checkin";
import { calculateMonthlyMoney } from "@/lib/simulation/monthly-checkin";
import type { MonthlyCheckinReason, SavedPlan } from "@/lib/storage/plans";
import { MAX_CURRENT_MANWON, MAX_MONTHLY_MANWON } from "./constants";
import { MoneyInput, type QuickAmount } from "./money-input";

type MonthlyCheckin = SavedPlan["checkins"][number];
type EntryMode = "savings" | "cashflow";

export interface MonthlyMoneyCheckPreview {
  contributionDifference: number;
  shortage: number;
  shortageDifference: number | null;
}

export interface MonthlyMoneyCheckSubmission {
  actualContribution: number;
  monthlyIncome: number | null;
  monthlyExpenses: number | null;
  reason: MonthlyCheckinReason | null;
}

interface MonthlyMoneyCheckProps {
  existingCheckin: MonthlyCheckin | null;
  firstCheckinUpfrontAmount: number;
  plannedContribution: number;
  getPreview: (actualContribution: number) => MonthlyMoneyCheckPreview | null;
  onSave: (submission: MonthlyMoneyCheckSubmission) => Promise<void>;
}

const INCOME_QUICK_AMOUNTS: QuickAmount[] = [
  { label: "250만 원", value: 250 },
  { label: "350만 원", value: 350 },
  { label: "500만 원", value: 500 },
];

const EXPENSE_QUICK_AMOUNTS: QuickAmount[] = [
  { label: "100만 원", value: 100 },
  { label: "200만 원", value: 200 },
  { label: "300만 원", value: 300 },
];

export function MonthlyMoneyCheck({
  existingCheckin,
  firstCheckinUpfrontAmount,
  plannedContribution,
  getPreview,
  onSave,
}: MonthlyMoneyCheckProps) {
  const hasCashflowRecord = existingCheckin?.monthlyIncome !== null
    && existingCheckin?.monthlyIncome !== undefined
    && existingCheckin.monthlyExpenses !== null
    && existingCheckin.monthlyExpenses !== undefined;
  const [entryMode, setEntryMode] = useState<EntryMode>(hasCashflowRecord ? "cashflow" : "savings");
  const [actualSavingsManwon, setActualSavingsManwon] = useState<number | null>(
    existingCheckin?.actualContribution === null || existingCheckin?.actualContribution === undefined
      ? null
      : wonToManwon(existingCheckin.actualContribution),
  );
  const [incomeManwon, setIncomeManwon] = useState<number | null>(
    hasCashflowRecord ? wonToManwon(existingCheckin.monthlyIncome ?? 0) : null,
  );
  const [expensesManwon, setExpensesManwon] = useState<number | null>(
    hasCashflowRecord ? wonToManwon(existingCheckin.monthlyExpenses ?? 0) : null,
  );
  const [reason, setReason] = useState<MonthlyCheckinReason | null>(existingCheckin?.reason ?? null);
  const [saving, setSaving] = useState(false);

  const monthlyMoney = entryMode === "cashflow"
    && incomeManwon !== null
    && expensesManwon !== null
    && incomeManwon <= MAX_MONTHLY_MANWON
    && expensesManwon <= MAX_MONTHLY_MANWON
    ? calculateMonthlyMoney({
        income: manwonToWon(incomeManwon),
        expenses: manwonToWon(expensesManwon),
      })
    : null;
  const actualContribution = entryMode === "cashflow"
    ? monthlyMoney?.actualContribution ?? null
    : actualSavingsManwon !== null && actualSavingsManwon <= MAX_CURRENT_MANWON
      ? manwonToWon(actualSavingsManwon)
      : null;
  const preview = actualContribution === null ? null : getPreview(actualContribution);
  const savingsQuickAmounts: QuickAmount[] = [
    { label: "계획만큼", value: wonToManwon(plannedContribution) },
    { label: "10만 원 덜", value: Math.max(0, wonToManwon(plannedContribution) - 10) },
    { label: "10만 원 더", value: wonToManwon(plannedContribution) + 10 },
  ];

  async function saveMonthlyMoneyCheck() {
    if (actualContribution === null || !preview || saving) return;
    setSaving(true);
    try {
      await onSave({
        actualContribution,
        monthlyIncome: entryMode === "cashflow" && incomeManwon !== null
          ? manwonToWon(incomeManwon)
          : null,
        monthlyExpenses: entryMode === "cashflow" && expensesManwon !== null
          ? manwonToWon(expensesManwon)
          : null,
        reason,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="update-form">
      <fieldset className="checkin-mode">
        <legend>기록 방법</legend>
        <div>
          <button type="button" aria-pressed={entryMode === "savings"} onClick={() => setEntryMode("savings")}>저축액만 입력</button>
          <button type="button" aria-pressed={entryMode === "cashflow"} onClick={() => setEntryMode("cashflow")}>수입·지출로 계산</button>
        </div>
        <p>{entryMode === "cashflow" ? "수입에서 총지출을 뺀 남은 돈을 실제 저축액으로 기록해요." : "이미 저축한 금액을 알고 있다면 숫자 하나만 입력하세요."}</p>
      </fieldset>

      {entryMode === "cashflow" ? (
        <>
          <div className="monthly-cashflow-grid">
            <MoneyInput
              id="actual-monthly-income"
              label="이번 달 들어온 돈"
              hint="월급과 부수입 등 실제 수입을 합쳐 입력하세요. 계좌 간 이체는 제외합니다."
              value={incomeManwon}
              onChange={setIncomeManwon}
              maxValue={MAX_MONTHLY_MANWON}
              quickAmounts={INCOME_QUICK_AMOUNTS}
            />
            <MoneyInput
              id="actual-monthly-expenses"
              label="이번 달 쓴 돈"
              hint="고정비와 생활비 등 실제 지출을 합쳐 입력하세요. 저축과 투자는 제외합니다."
              value={expensesManwon}
              onChange={setExpensesManwon}
              maxValue={MAX_MONTHLY_MANWON}
              quickAmounts={EXPENSE_QUICK_AMOUNTS}
            />
          </div>
          {monthlyMoney && (
            <div className={`monthly-cashflow-result ${monthlyMoney.remainingAmount < 0 ? "monthly-cashflow-result--negative" : ""}`} aria-live="polite">
              <span>이번 달 남은 돈</span>
              <strong>{formatCurrency(monthlyMoney.remainingAmount)}</strong>
              <small>{monthlyMoney.remainingAmount < 0
                ? `지출이 수입보다 ${formatCurrency(Math.abs(monthlyMoney.remainingAmount))} 많아 목표 저축에는 0원을 반영해요.`
                : "남은 돈을 이번 달 실제 저축액으로 반영해요."}</small>
            </div>
          )}
        </>
      ) : (
        <MoneyInput
          id="actual-monthly-savings"
          label="이번 달 실제로 모은 돈"
          hint="목표를 위해 새로 남긴 금액만 입력하세요."
          value={actualSavingsManwon}
          onChange={setActualSavingsManwon}
          maxValue={MAX_CURRENT_MANWON}
          quickAmounts={savingsQuickAmounts}
        />
      )}

      {firstCheckinUpfrontAmount > 0 && (
        <p className="update-plan-note">첫 기록이라 시작 자금 {formatCurrency(firstCheckinUpfrontAmount)}도 계획에 포함했어요.</p>
      )}

      {preview && actualContribution !== null && (
        <div className="monthly-checkin-preview" aria-live="polite">
          <div><span>계획</span><strong>{formatCurrency(plannedContribution)}</strong></div>
          <div><span>실제</span><strong>{formatCurrency(actualContribution)}</strong></div>
          <div><span>차이</span><strong className={preview.contributionDifference < 0 ? "negative" : ""}>{preview.contributionDifference > 0 ? "+" : ""}{formatCurrency(preview.contributionDifference)}</strong></div>
          <p><strong>{savingsDifferenceCopy(preview.contributionDifference)}</strong>{preview.shortageDifference === null || preview.shortageDifference === 0 ? " 목표 계획의 큰 흐름은 그대로예요." : ` 목표일까지 예상 부족분이 ${formatCurrency(Math.abs(preview.shortageDifference))} ${preview.shortageDifference > 0 ? "줄어요." : "늘어요."}`}</p>
        </div>
      )}

      <fieldset className="checkin-reasons">
        <legend>달라진 이유 (선택)</legend>
        <div>
          {MONTHLY_CHECKIN_REASONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={reason === option.id}
              onClick={() => setReason(reason === option.id ? null : option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="button button--primary" type="button" disabled={!preview || saving} onClick={saveMonthlyMoneyCheck}>
        {saving ? "저장 중" : existingCheckin ? "이번 달 기록 수정" : "이번 달 기록 저장"}
      </button>
    </div>
  );
}
