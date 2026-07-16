"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { formatCurrency, manwonToWon, wonToManwon } from "@/lib/format/currency";
import { formatArrivalDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";
import { dateToMonthValue, futureMonthValue, monthValueToDate } from "@/lib/format/month-value";
import {
  analyzeGoalPlan,
  projectedBalanceAtTarget,
  type GoalActionPlanId,
  type GoalFeasibilityLimits,
} from "@/lib/simulation/goal-solver";
import { simulatePlan } from "@/lib/simulation/engine";
import {
  analyzeConditionAtTarget,
  conditionPresets,
  type ConditionPresetId,
} from "@/lib/simulation/scenarios";
import type { CashflowInput, SimulationInput } from "@/lib/simulation/types";
import {
  deleteSavedPlan,
  exportBackup,
  importBackup,
  loadSavedPlan,
  savePlan,
  SCHEMA_VERSION,
  type SavedPlan,
} from "@/lib/storage/plans";
import { AssetChart } from "./asset-chart";
import { CashflowHelper } from "./cashflow-helper";
import { MAX_CURRENT_MANWON, MAX_GOAL_MANWON, MAX_MONTHLY_MANWON } from "./constants";
import { GoalDateInput } from "./goal-date-input";
import { MoneyInput } from "./money-input";
import { PolicyBenefitFinder } from "./policy-benefit-finder";
import { Progress } from "./progress";
import { useMoneyGpsAnalysis } from "./use-money-gps-analysis";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Phase = "intro" | "wizard" | "result";

interface MoneyGpsAppProps {
  autoStart?: boolean;
}

function trackEvent(eventName: string, properties: Record<string, string | number> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, {
    page_path: window.location.pathname,
    ...properties,
  });
}

function monthlyChangeCopy(amount: number): string {
  if (amount > 0) return `현재보다 매달 ${formatCurrency(amount)} 더`;
  if (amount < 0) return `현재보다 매달 ${formatCurrency(Math.abs(amount))} 덜어도 가능`;
  return "현재 월 적립액 유지";
}

function shortageChangeCopy(change: number): string {
  if (change > 0) return `부족분 ${formatCurrency(change)} 감소`;
  if (change < 0) return `부족분 ${formatCurrency(Math.abs(change))} 증가`;
  return "부족분 변화 없음";
}

function actionPlanTrait(id: GoalActionPlanId, onTrack: boolean): string {
  if (onTrack) {
    if (id === "monthly") return "현재대로";
    if (id === "balanced") return "월 부담 낮춤";
    return "기간 확인";
  }
  if (id === "monthly") return "목돈 없이";
  if (id === "balanced") return "월+목돈";
  return "기간 조정";
}

function timelineChangeCopy(monthAdjustment: number | null): string {
  if (monthAdjustment === null) return "현재 계획으로는 기간을 정하기 어려워요";
  if (monthAdjustment === 0) return "현재 목표 날짜 유지";
  return monthAdjustment > 0
    ? `현재 목표보다 ${formatDuration(monthAdjustment)} 늦춰요`
    : `현재 목표보다 ${formatDuration(Math.abs(monthAdjustment))} 먼저 도달해요`;
}

export function MoneyGpsApp({ autoStart = false }: MoneyGpsAppProps) {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>(autoStart ? "wizard" : "intro");
  const [step, setStep] = useState(1);
  const [goalManwon, setGoalManwon] = useState<number | null>(null);
  const [goalDate, setGoalDate] = useState("");
  const [currentManwon, setCurrentManwon] = useState<number | null>(null);
  const [monthlyManwon, setMonthlyManwon] = useState<number | null>(null);
  const [annualRate, setAnnualRate] = useState(0);
  const [cashflowHelperOpen, setCashflowHelperOpen] = useState(false);
  const [cashflowValues, setCashflowValues] = useState<CashflowInput | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<ConditionPresetId[]>([]);
  const [selectedAction, setSelectedAction] = useState<GoalActionPlanId | null>(null);
  const [completedActionSteps, setCompletedActionSteps] = useState<number[]>([]);
  const [monthlyExtraLimitManwon, setMonthlyExtraLimitManwon] = useState<number | null>(null);
  const [upfrontLimitManwon, setUpfrontLimitManwon] = useState<number | null>(null);
  const [feasibilityLimits, setFeasibilityLimits] = useState<GoalFeasibilityLimits | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("나의 목표 계획");
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateAmount, setUpdateAmount] = useState<number | null>(null);
  const [updateMemo, setUpdateMemo] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const calculatorRef = useRef<HTMLElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadSavedPlan();
    queueMicrotask(() => {
      setHydrated(true);
      setSavedPlan(stored);
      if (stored) setPlanName(stored.name);
      if (autoStart) {
        const preset = new URLSearchParams(window.location.search).get("preset");
        const presetValues: Record<string, [number, number, number, ConditionPresetId?]> = {
          "monthly-500k-to-100m": [10000, 0, 50],
          "monthly-1m-to-100m": [10000, 0, 100],
          "current-30m-to-100m": [10000, 3000, 100],
          "cut-expenses-200k": [10000, 3000, 90, "monthly-200k"],
          "bonus-5m": [10000, 0, 100, "bonus-5m"],
          "car-30m": [10000, 3000, 100, "car-30m"],
        };
        const values = preset ? presetValues[preset] : undefined;
        if (values) {
          setGoalManwon(values[0]);
          setGoalDate(futureMonthValue(5));
          setCurrentManwon(values[1]);
          setMonthlyManwon(values[2]);
          if (values[3]) setSelectedConditions([values[3]]);
        }
      }
    });
  }, [autoStart]);

  const { baseInput, goalAnalysis, goalDateIsFuture, parsedGoalDate, result } = useMoneyGpsAnalysis({
    annualRate,
    cashflowMode: cashflowValues !== null,
    currentManwon,
    feasibilityLimits,
    goalDate,
    goalManwon,
    monthlyManwon,
  });
  const selectedActionPlan = selectedAction
    ? goalAnalysis?.actionPlans.find((plan) => plan.id === selectedAction) ?? null
    : null;
  const selectedFirstMonthBalance = selectedActionPlan && baseInput
    ? projectedBalanceAtTarget({
        currentAmount: baseInput.currentAmount,
        monthlyContribution: selectedActionPlan.monthlyContribution,
        upfrontAmount: selectedActionPlan.upfrontAmount,
        annualRate: baseInput.annualRate,
        months: 1,
      })
    : null;
  const monthlyActionItems = selectedActionPlan && selectedFirstMonthBalance !== null
    ? [
        {
          when: "오늘",
          title: selectedActionPlan.id === "timeline"
            ? selectedActionPlan.adjustedTargetDate
              ? `목표 날짜를 ${formatArrivalDate(selectedActionPlan.adjustedTargetDate)}로 조정하기`
              : "달성 가능한 목표 날짜를 다시 정하기"
            : `월 자동이체를 ${formatCurrency(selectedActionPlan.monthlyContribution)}으로 설정하기`,
          description: selectedActionPlan.id === "timeline"
            ? "월 적립 부담은 유지하고 달성 가능한 날짜를 계획에 반영하세요."
            : "목표 전용 계좌로 분리하면 월말 확인이 쉬워져요.",
        },
        {
          when: "이번 달",
          title: selectedActionPlan.id === "timeline"
            ? `월 자동이체 ${formatCurrency(selectedActionPlan.monthlyContribution)} 유지하기`
            : selectedActionPlan.upfrontAmount > 0
            ? `시작 자금 ${formatCurrency(selectedActionPlan.upfrontAmount)} 보태기`
            : `${monthlyChangeCopy(selectedActionPlan.monthlyIncrease)} 실행하기`,
          description: selectedActionPlan.id === "timeline"
            ? "금액을 무리하게 늘리지 않는 대신 조정한 날짜를 지키는 방식입니다."
            : "한 번에 어렵다면 다른 실행안을 선택해 부담을 조정할 수 있어요.",
        },
        {
          when: "말일",
          title: `목표 전용 잔액 ${formatCurrency(selectedFirstMonthBalance)} 이상인지 확인하기`,
          description: "달성 여부만 확인하고 다음 달 계획을 같은 기준으로 이어가세요.",
        },
      ]
    : [];

  function scrollToCalculator() {
    requestAnimationFrame(() => calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function startCalculation() {
    setPhase("wizard");
    setStep(1);
    setEditingPlanId(null);
    trackEvent("gps_started");
    scrollToCalculator();
  }

  function nextStep() {
    if (step === 1 && (goalManwon === null || goalManwon <= 0 || goalManwon > MAX_GOAL_MANWON || !goalDateIsFuture)) return;
    if (step === 2 && (currentManwon === null || currentManwon < 0 || currentManwon > MAX_CURRENT_MANWON)) return;
    trackEvent("gps_step_completed", { step_number: step });
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (monthlyManwon === null || Math.abs(monthlyManwon) > MAX_MONTHLY_MANWON) return;
    setAnnualRate(0);
    setSelectedAction(null);
    setCompletedActionSteps([]);
    setMonthlyExtraLimitManwon(null);
    setUpfrontLimitManwon(null);
    setFeasibilityLimits(null);
    setPhase("result");
    trackEvent("gps_calculation_completed", { result_status: monthlyManwon >= 0 ? "calculated" : "negative_flow" });
    scrollToCalculator();
  }

  function loadPlan(plan: SavedPlan, openUpdate = false) {
    setGoalManwon(wonToManwon(plan.goalAmount));
    setGoalDate(plan.targetDate);
    setCurrentManwon(wonToManwon(plan.currentAmount));
    setMonthlyManwon(wonToManwon(plan.monthlyContribution));
    setAnnualRate(plan.annualRate);
    setSelectedAction(plan.actionPlan?.id ?? null);
    setCompletedActionSteps(plan.completedActionSteps);
    setMonthlyExtraLimitManwon(plan.feasibilityLimits ? wonToManwon(plan.feasibilityLimits.maxMonthlyIncrease) : null);
    setUpfrontLimitManwon(plan.feasibilityLimits ? wonToManwon(plan.feasibilityLimits.maxUpfrontAmount) : null);
    setFeasibilityLimits(plan.feasibilityLimits);
    setCashflowValues(null);
    setEditingPlanId(plan.id);
    setPhase("result");
    setUpdateAmount(wonToManwon(plan.currentAmount));
    setUpdateOpen(openUpdate);
    scrollToCalculator();
  }

  function handleSave() {
    if (!baseInput || !result || !parsedGoalDate || !planName.trim() || !selectedActionPlan) return;
    const replacingExistingPlan = savedPlan !== null && editingPlanId !== savedPlan.id;
    if (replacingExistingPlan && !window.confirm(`이 브라우저에 저장된 '${savedPlan.name}' 계획을 새 계획으로 교체할까요?`)) return;
    const planId = editingPlanId === savedPlan?.id
      ? savedPlan.id
      : globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const savedTargetDate = selectedActionPlan.id === "timeline" && selectedActionPlan.adjustedTargetDate
      ? dateToMonthValue(selectedActionPlan.adjustedTargetDate)
      : goalDate;
    const plan: SavedPlan = {
      schemaVersion: SCHEMA_VERSION,
      id: planId,
      name: planName.trim(),
      savedAt: new Date().toISOString(),
      goalAmount: baseInput.goalAmount,
      currentAmount: baseInput.currentAmount,
      monthlyContribution: baseInput.monthlyNetFlow,
      annualRate: baseInput.annualRate,
      targetDate: savedTargetDate,
      arrivalDate: result.arrivalDate?.toISOString() ?? null,
      projectedAtTarget: selectedActionPlan.projectedAtTarget,
      shortage: selectedActionPlan.shortageAtTarget,
      actionPlan: {
        id: selectedActionPlan.id,
        title: selectedActionPlan.title,
        monthlyContribution: selectedActionPlan.monthlyContribution,
        upfrontAmount: selectedActionPlan.upfrontAmount,
        adjustedTargetDate: selectedActionPlan.adjustedTargetDate
          ? dateToMonthValue(selectedActionPlan.adjustedTargetDate)
          : null,
      },
      completedActionSteps,
      feasibilityLimits,
      checkins: editingPlanId === savedPlan?.id ? savedPlan.checkins : [],
    };
    setSavedPlan(savePlan(plan));
    setEditingPlanId(plan.id);
    if (savedTargetDate !== goalDate) setGoalDate(savedTargetDate);
    setStatusMessage("계획을 이 브라우저에 저장했어요.");
    trackEvent("plan_saved");
  }

  function selectGoalAction(id: GoalActionPlanId) {
    setSelectedAction(id);
    setCompletedActionSteps([]);
    trackEvent("goal_action_selected", { action_type: id });
  }

  function toggleActionStep(index: number) {
    const next = completedActionSteps.includes(index)
      ? completedActionSteps.filter((item) => item !== index)
      : [...completedActionSteps, index].sort();
    setCompletedActionSteps(next);
    if (savedPlan && editingPlanId === savedPlan.id && savedPlan.actionPlan?.id === selectedAction) {
      const updatedPlan = { ...savedPlan, completedActionSteps: next };
      setSavedPlan(savePlan(updatedPlan));
    }
  }

  function applyFeasibilityLimits() {
    const monthlyLimit = monthlyExtraLimitManwon ?? 0;
    const upfrontLimit = upfrontLimitManwon ?? 0;
    if (monthlyLimit > MAX_MONTHLY_MANWON || upfrontLimit > MAX_CURRENT_MANWON) return;
    setFeasibilityLimits({
      maxMonthlyIncrease: manwonToWon(monthlyLimit),
      maxUpfrontAmount: manwonToWon(upfrontLimit),
    });
    setSelectedAction(null);
    setCompletedActionSteps([]);
    setStatusMessage("입력한 가능 범위에 맞춰 실행안을 다시 계산했어요.");
    trackEvent("feasibility_limits_applied");
  }

  function clearFeasibilityLimits() {
    setMonthlyExtraLimitManwon(null);
    setUpfrontLimitManwon(null);
    setFeasibilityLimits(null);
    setSelectedAction(null);
    setCompletedActionSteps([]);
    setStatusMessage("가능 범위를 초기화하고 계산상 필요한 실행안을 보여드려요.");
  }

  function handleMonthlyUpdate() {
    if (!savedPlan || updateAmount === null) return;
    const targetDate = monthValueToDate(savedPlan.targetDate);
    if (!targetDate || updateAmount > MAX_CURRENT_MANWON) return;
    const updatedInput: SimulationInput = {
      goalAmount: savedPlan.goalAmount,
      currentAmount: manwonToWon(updateAmount),
      monthlyNetFlow: selectedActionPlan?.monthlyContribution
        ?? savedPlan.actionPlan?.monthlyContribution
        ?? savedPlan.monthlyContribution,
      annualRate: savedPlan.annualRate,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    };
    const updatedResult = simulatePlan(updatedInput);
    const updatedAnalysis = analyzeGoalPlan(updatedInput, targetDate, savedPlan.feasibilityLimits);
    const shortageDifference = savedPlan.shortage === null
      ? null
      : savedPlan.shortage - updatedAnalysis.shortage;
    const updatedPlan: SavedPlan = {
      ...savedPlan,
      savedAt: new Date().toISOString(),
      currentAmount: updatedInput.currentAmount,
      arrivalDate: updatedResult.arrivalDate?.toISOString() ?? null,
      projectedAtTarget: updatedAnalysis.projectedAtTarget,
      shortage: updatedAnalysis.shortage,
      actionPlan: selectedActionPlan
        ? {
            id: selectedActionPlan.id,
            title: selectedActionPlan.title,
            monthlyContribution: selectedActionPlan.monthlyContribution,
            upfrontAmount: selectedActionPlan.upfrontAmount,
            adjustedTargetDate: selectedActionPlan.adjustedTargetDate
              ? dateToMonthValue(selectedActionPlan.adjustedTargetDate)
              : null,
          }
        : savedPlan.actionPlan,
      completedActionSteps: [],
      checkins: [
        ...savedPlan.checkins,
        {
          date: new Date().toISOString(),
          currentAmount: updatedInput.currentAmount,
          projectedAtTarget: updatedAnalysis.projectedAtTarget,
          shortage: updatedAnalysis.shortage,
          shortageDifference,
          completedActionSteps,
          memo: updateMemo.trim(),
        },
      ],
    };
    setSavedPlan(savePlan(updatedPlan));
    setCurrentManwon(updateAmount);
    setCompletedActionSteps([]);
    setUpdateOpen(false);
    setUpdateMemo("");
    setStatusMessage(
      shortageDifference === null
        ? "이번 달 값으로 계획을 업데이트했어요. 이제부터 목표일까지의 부족분을 비교할 수 있어요."
        : updatedAnalysis.shortage === 0
          ? "현재 실행 계획으로 목표 날짜를 맞출 수 있어요."
          : shortageDifference === 0
            ? "목표일까지 예상 부족분은 지난 업데이트와 같아요."
            : `목표일까지 예상 부족분이 ${formatCurrency(Math.abs(shortageDifference))} ${shortageDifference > 0 ? "줄었어요" : "늘었어요"}.`,
    );
    trackEvent("monthly_update_saved");
  }

  async function copyResult() {
    if (!goalAnalysis) return;
    const copy = `${formatArrivalDate(goalAnalysis.targetDate)} 목표 기준으로, 현재 계획은 ${goalAnalysis.onTrack ? "목표 금액을 맞출 수 있어요" : "조정이 필요해요"}.${selectedActionPlan ? ` 선택한 실행 방식은 '${selectedActionPlan.title}'입니다.` : ""}\n\nINVETK Money GPS`;
    await navigator.clipboard.writeText(copy);
    setStatusMessage("개인 금액을 제외한 결과를 복사했어요.");
    trackEvent("result_copied");
  }

  async function shareResult() {
    if (!goalAnalysis) return;
    const text = `${formatArrivalDate(goalAnalysis.targetDate)} 목표 기준으로 ${goalAnalysis.onTrack ? "현재 계획을 유지하면 목표를 맞출 수 있어요" : "부족분을 채울 실행 계획을 만들었어요"}.${selectedActionPlan ? ` 선택한 방식은 '${selectedActionPlan.title}'입니다.` : ""}\n\nINVETK Money GPS`;
    if (navigator.share) {
      await navigator.share({ title: "INVETK Money GPS", text, url: "https://invetk.com" });
      trackEvent("web_share_used");
      return;
    }
    await navigator.clipboard.writeText(text);
    setStatusMessage("공유할 문장을 복사했어요.");
  }

  async function copyMonthlyActionPlan() {
    if (!selectedActionPlan || !baseInput || !goalAnalysis) return;
    const firstMonthBalance = projectedBalanceAtTarget({
      currentAmount: baseInput.currentAmount,
      monthlyContribution: selectedActionPlan.monthlyContribution,
      upfrontAmount: selectedActionPlan.upfrontAmount,
      annualRate: baseInput.annualRate,
      months: 1,
    });
    const lines = [
      `[INVETK 이번 달 행동 계획 · ${selectedActionPlan.title}]`,
      selectedActionPlan.id === "timeline"
        ? `1. 목표 날짜를 ${formatArrivalDate(selectedActionPlan.adjustedTargetDate)}로 조정하기`
        : `1. 월 자동이체를 ${formatCurrency(selectedActionPlan.monthlyContribution)}으로 설정하기`,
      selectedActionPlan.id === "timeline"
        ? `2. 월 자동이체 ${formatCurrency(selectedActionPlan.monthlyContribution)} 유지하기`
        : selectedActionPlan.upfrontAmount > 0
        ? `2. 이번 달 안에 시작 자금 ${formatCurrency(selectedActionPlan.upfrontAmount)} 보태기`
        : `2. ${monthlyChangeCopy(selectedActionPlan.monthlyIncrease)} 실행하기`,
      `3. 이달 말 목표 전용 잔액 ${formatCurrency(firstMonthBalance)} 이상인지 확인하기`,
      `${formatArrivalDate(selectedActionPlan.adjustedTargetDate ?? goalAnalysis.targetDate)} 목표 · 연 ${annualRate}% 계산 가정`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setStatusMessage("이번 달 행동 계획을 복사했어요.");
    trackEvent("monthly_action_plan_copied", { action_type: selectedActionPlan.id });
  }

  function createShareCard() {
    if (!goalAnalysis) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f3f1e8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0d2b33";
    context.font = "700 42px sans-serif";
    context.fillText("INVETK  Money GPS", 72, 100);
    context.font = "700 72px sans-serif";
    context.fillText(`${formatArrivalDate(goalAnalysis.targetDate)} 목표`, 72, 280);
    context.fillStyle = "#0b8275";
    context.font = "600 42px sans-serif";
    context.fillText(goalAnalysis.onTrack ? "현재 계획으로 목표를 맞출 수 있어요" : "부족분을 채울 실행 계획을 만들었어요", 72, 370);
    context.fillStyle = "#52646a";
    context.font = "32px sans-serif";
    context.fillText("개인 금융 금액은 카드에 포함하지 않았어요 · invetk.com", 72, 535);
    const link = document.createElement("a");
    link.download = "invetk-money-gps.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setStatusMessage("개인 금액을 제외한 공유 카드를 만들었어요.");
    trackEvent("share_card_created");
  }

  function downloadBackup() {
    if (!savedPlan) return;
    const blob = new Blob([exportBackup(savedPlan)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "invetk-money-gps-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatusMessage("데이터 백업 파일을 만들었어요.");
    trackEvent("backup_exported");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = importBackup(await file.text());
      const stored = savePlan(imported);
      setSavedPlan(stored);
      setPlanName(stored.name);
      setStatusMessage("백업을 불러왔어요.");
      trackEvent("backup_imported");
    } catch {
      setStatusMessage("백업 파일을 읽지 못했어요. 올바른 파일인지 확인해 주세요.");
    } finally {
      event.target.value = "";
    }
  }

  function removeLocalData() {
    if (!window.confirm("이 브라우저에 저장된 계획과 기록을 모두 삭제할까요?")) return;
    deleteSavedPlan();
    setSavedPlan(null);
    setEditingPlanId(null);
    setStatusMessage("이 브라우저에 저장된 데이터를 모두 삭제했어요.");
    trackEvent("local_data_deleted");
  }

  const currentValid = step === 1
    ? goalManwon !== null && goalManwon > 0 && goalManwon <= MAX_GOAL_MANWON && goalDateIsFuture
    : step === 2
      ? currentManwon !== null && currentManwon >= 0 && currentManwon <= MAX_CURRENT_MANWON
      : monthlyManwon !== null && Math.abs(monthlyManwon) <= MAX_MONTHLY_MANWON;

  return (
    <main id="main-content" data-hydrated={hydrated}>
      {!autoStart && phase === "intro" && (
        <>
          <section className="hero">
            <div className="hero__copy">
              <div className="eyebrow"><span /> 돈 목표 해결 도구</div>
              <h1>5년 안에 1억,<br /><em>지금 계획으로 가능할까요?</em></h1>
              <p>목표가 부족하다면 얼마나 더 모아야 하는지, 목돈이 얼마나 필요한지, 기간을 얼마나 조정해야 하는지 계산해 드립니다.</p>
              <div className="hero__actions">
                <button className="button button--primary button--large" type="button" disabled={!hydrated} onClick={startCalculation}>내 해결안 만들기 <span aria-hidden="true">→</span></button>
                <a className="button button--text" href="#how">어떻게 계산하나요?</a>
              </div>
              <ul className="hero__proof" aria-label="서비스 특징">
                <li>3단계 입력</li><li>가입 없이</li><li>약 60초</li>
              </ul>
            </div>
            <div className="route-card" aria-label="계산 예시">
              <div className="route-card__top"><span>예시 진단</span><small>수익률 0%</small></div>
              <div className="route-line" aria-hidden="true">
                <span className="route-dot route-dot--start" /><span className="route-path" /><span className="route-dot route-dot--end" />
              </div>
              <div className="route-points">
                <div><small>지금</small><strong>3,000만 원</strong></div>
                <div><small>매달</small><strong>100만 원</strong></div>
                <div><small>5년 뒤 목표</small><strong>1억 원</strong></div>
              </div>
              <div className="route-arrival"><span>예상 부족분</span><strong>1,000만 원</strong></div>
              <div className="route-solution"><span>해결 예시</span><strong>월 +17만 · 월 +9만과 목돈 500만 · 기간 +10개월</strong></div>
              <p>세 해결책은 입력값을 바탕으로 한 계산 예시이며 금융상품 추천이 아닙니다.</p>
            </div>
          </section>
          <section className="trust-row" aria-label="신뢰 원칙">
            <span>브라우저 안에서 계산</span><span>가입 없이 시작</span><span>계산 기준 공개</span><span>금융상품 추천 없음</span>
          </section>
        </>
      )}

      {savedPlan && phase === "intro" && (
        <section className="return-card" aria-labelledby="return-title">
          <div><span className="section-kicker">저장된 계획</span><h2 id="return-title">{savedPlan.name}의 경로를 이어볼까요?</h2><p>마지막 저장 {new Date(savedPlan.savedAt).toLocaleDateString("ko-KR")}</p></div>
          <div className="return-actions">
            <button className="button button--primary" type="button" onClick={() => loadPlan(savedPlan, true)}>이번 달 업데이트</button>
            <button className="button button--quiet" type="button" onClick={() => loadPlan(savedPlan)}>계획 다시 보기</button>
          </div>
        </section>
      )}

      <section ref={calculatorRef} id="calculator" className={`calculator-shell ${phase === "intro" ? "calculator-shell--preview" : ""}`} aria-labelledby="calculator-title">
        {phase === "intro" ? (
          <div className="calculator-preview">
            <span className="section-kicker">첫 계산은 간단하게</span>
            <h2 id="calculator-title">세 단계면 해결안이 보여요</h2>
            <div className="preview-steps">
              <div><b>01</b><span>목표 금액과 날짜</span></div><div><b>02</b><span>지금까지 모은 돈</span></div><div><b>03</b><span>매달 모을 돈</span></div>
            </div>
            <div className="preview-actions">
              <button className="button button--primary" type="button" disabled={!hydrated} onClick={startCalculation}>첫 질문 시작하기</button>
              <button className="button button--quiet" type="button" disabled={!hydrated} onClick={() => importRef.current?.click()}>백업 불러오기</button>
            </div>
          </div>
        ) : phase === "wizard" ? (
          <div className="wizard-card" onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" && currentValid && event.target instanceof HTMLInputElement) nextStep();
          }}>
            <Progress current={step} />
            {step > 1 && parsedGoalDate && (
              <div className="wizard-context" aria-label="앞에서 입력한 내용">
                <span><small>목표</small><strong>{formatCurrency(manwonToWon(goalManwon ?? 0))}</strong></span>
                <span><small>날짜</small><strong>{formatArrivalDate(parsedGoalDate)}</strong></span>
                {step === 3 && currentManwon !== null && <span><small>현재</small><strong>{formatCurrency(manwonToWon(currentManwon))}</strong></span>}
              </div>
            )}
            <div className="wizard-heading">
              <span className="section-kicker">{step === 1 ? "목적지" : step === 2 ? "현재 위치" : "이동 속도"}</span>
              <h1 id="calculator-title">{step === 1 ? "언제까지 얼마를 만들고 싶나요?" : step === 2 ? "지금까지 모은 돈은 얼마인가요?" : "매달 얼마를 모을 수 있나요?"}</h1>
              <p>{step === 1 ? "목표 금액과 그 돈이 필요한 날짜를 함께 정해보세요." : step === 2 ? "예금과 투자자산 등 목표에 쓸 수 있는 돈을 합쳐보세요." : "월급날마다 꾸준히 더할 수 있는 금액을 적어보세요."}</p>
            </div>
            {step === 1 && (
              <div className="goal-step-grid">
                <MoneyInput id="goal-amount" label="목표 금액" hint="1억 원이라면 10,000을 입력하세요." value={goalManwon} onChange={setGoalManwon} maxValue={MAX_GOAL_MANWON} quickAmounts={[{ label: "3,000만 원", value: 3000 }, { label: "5,000만 원", value: 5000 }, { label: "1억 원", value: 10000 }]} />
                <GoalDateInput value={goalDate} onChange={setGoalDate} />
                <div className="goal-readiness" aria-live="polite">
                  <span className={goalManwon !== null && goalManwon > 0 ? "is-ready" : ""}><b aria-hidden="true">{goalManwon !== null && goalManwon > 0 ? "✓" : "1"}</b> 목표 금액</span>
                  <span className={goalDateIsFuture ? "is-ready" : ""}><b aria-hidden="true">{goalDateIsFuture ? "✓" : "2"}</b> 목표 날짜</span>
                </div>
              </div>
            )}
            {step === 2 && (
              <MoneyInput id="current-amount" label="지금까지 모은 돈" hint="아직 시작 전이라면 0원도 괜찮아요." value={currentManwon} onChange={setCurrentManwon} maxValue={MAX_CURRENT_MANWON} quickAmounts={[{ label: "0원", value: 0 }, { label: "500만 원", value: 500 }, { label: "1,000만 원", value: 1000 }, { label: "3,000만 원", value: 3000 }]} />
            )}
            {step === 3 && (
              <>
                <MoneyInput id="monthly-amount" label={cashflowValues ? "계산된 매달 모을 돈" : "매달 모을 돈"} hint={cashflowValues ? "월 실수령액에서 고정비, 생활비, 대출 상환액을 뺀 금액입니다." : "투자수익은 빼고, 순수하게 매달 더할 원금을 입력하세요."} value={monthlyManwon} onChange={(value) => { setMonthlyManwon(value); setCashflowValues(null); }} maxValue={MAX_MONTHLY_MANWON} quickAmounts={[{ label: "30만 원", value: 30 }, { label: "50만 원", value: 50 }, { label: "100만 원", value: 100 }]} readOnly={Boolean(cashflowValues)} />
                {cashflowValues ? (
                  <div className={`flow-summary ${(monthlyManwon ?? 0) < 0 ? "flow-summary--warning" : ""}`}>
                    <span>{(monthlyManwon ?? 0) < 0 ? "이 계획을 유지하면 돈이 부족해질 수 있어요" : "월급과 지출로 계산했어요"}</span>
                    <strong>{formatCurrency(manwonToWon(monthlyManwon ?? 0))}</strong>
                    <button type="button" onClick={() => { setCashflowValues(null); setMonthlyManwon(null); }}>직접 입력으로 돌아가기</button>
                  </div>
                ) : (
                  <button className="helper-trigger" type="button" onClick={() => setCashflowHelperOpen(true)}><span aria-hidden="true">＋</span><span><strong>월 적립액을 잘 모르겠어요</strong><small>월급과 지출로 계산하기</small></span><b aria-hidden="true">→</b></button>
                )}
              </>
            )}
            <div className="wizard-actions">
              <button type="button" className="button button--quiet" onClick={() => step === 1 ? setPhase(autoStart ? "wizard" : "intro") : setStep(step - 1)} disabled={autoStart && step === 1}>이전</button>
              <button type="button" className="button button--primary" onClick={nextStep} disabled={!currentValid}>{step === 3 ? "부족분과 해결안 보기" : "다음"} <span aria-hidden="true">→</span></button>
            </div>
            <p className="privacy-note"><span aria-hidden="true">●</span> 입력한 금액은 서버로 전송되지 않아요.</p>
          </div>
        ) : result && baseInput && goalAnalysis ? (
          <div className="results" aria-live="polite">
            <div className={`result-hero ${goalAnalysis.onTrack ? "result-hero--on-track" : ""}`}>
              <div className="result-route-label"><span className="pulse-dot" /> {annualRate === 0 ? "원금 기준 진단" : `연 ${annualRate}% 계산 가정`} · {formatArrivalDate(goalAnalysis.targetDate)} 목표</div>
              <div className={`result-status-badge ${goalAnalysis.onTrack ? "result-status-badge--good" : ""}`}>{goalAnalysis.onTrack ? "현재 계획으로 가능" : "계획 조정 필요"}</div>
              <div className="completion-rate"><span>예상 목표 충족률</span><strong>{Math.min(100, Math.max(0, Math.round((goalAnalysis.projectedAtTarget / baseInput.goalAmount) * 100)))}%</strong></div>
              <p>{goalAnalysis.onTrack ? "목표 날짜까지 예상 여유" : "목표 날짜까지 예상 부족분"}</p>
              <h1 id="calculator-title">
                {goalAnalysis.onTrack
                  ? goalAnalysis.surplus > 0 ? `${formatCurrency(goalAnalysis.surplus)} 여유` : "부족분 없음"
                  : `${formatCurrency(goalAnalysis.shortage)} 부족`}
              </h1>
              <p className="result-verdict">
                {goalAnalysis.onTrack
                  ? "지금 계획을 이어가면 원하는 날짜에 목표를 맞출 수 있어요."
                  : "지금 계획만으로는 부족하지만, 월 적립 확대·월 적립과 목돈 조합·기간 조정 중에서 선택할 수 있어요."}
              </p>
              <div className="target-status-grid">
                <div><span>원하는 목표 날짜</span><strong>{formatArrivalDate(goalAnalysis.targetDate)}</strong></div>
                <div><span>그날 예상 금액</span><strong>{formatCurrency(goalAnalysis.projectedAtTarget)}</strong></div>
                <div><span>목표까지 남은 기간</span><strong>{formatDuration(goalAnalysis.monthsRemaining)}</strong></div>
              </div>
              <div className="result-quick-fix">
                <span>{goalAnalysis.onTrack ? "계획을 지키는 기준" : "한 가지 계산 예"}</span>
                <strong>매달 {formatCurrency(goalAnalysis.actionPlans[0].monthlyContribution)}</strong>
                <small>{monthlyChangeCopy(goalAnalysis.actionPlans[0].monthlyIncrease)}</small>
                <a href="#solutions">세 가지 방법 비교 <span aria-hidden="true">↓</span></a>
              </div>
              {result.status === "insufficient_funds" && (
                <div className="warning-box"><strong>이 계획을 유지하면 돈이 부족해질 수 있어요</strong><p>{result.insufficientMonth}개월 뒤 약 {formatCurrency(result.insufficientAmount ?? 0)}이 부족해질 수 있습니다.</p></div>
              )}
              {result.status === "not_reached" && (
                <div className="warning-box"><strong>현재 조건에서는 100년 안에 목표 도착을 확인하기 어려워요.</strong><p>매달 모을 돈을 바꿔 도착 가능성을 비교해 보세요.</p></div>
              )}
            </div>

            <nav className="result-jump-nav" aria-label="결과 바로가기">
              <a href="#solutions"><span>1</span> 해결책 비교</a>
              <a href="#monthly-action"><span>2</span> 이번 달 행동</a>
              <a href="#policy-benefits"><span>3</span> 정책 혜택</a>
              <a href="#conditions"><span>4</span> 조건 바꿔보기</a>
            </nav>

            <details className="feasibility-panel">
              <summary>
                <span><b>선택 사항</b><strong>내가 가능한 범위로 실행안 맞추기</strong></span>
                <small>{feasibilityLimits ? "가능 범위 적용됨" : "월 추가금과 여유자금을 입력할 수 있어요"}</small>
              </summary>
              <div className="feasibility-panel__body">
                <p>실제로 감당할 수 있는 최대 금액을 알려주면, 월 적립안과 월 적립·여유자금 혼합안을 그 범위 안에서 다시 계산합니다. 기간 조정안은 현재 적립 계획을 유지하는 기준입니다.</p>
                <div className="feasibility-grid">
                  <MoneyInput
                    id="monthly-extra-limit"
                    label="매달 추가로 가능한 최대 금액"
                    hint="현재 적립액에 더할 수 있는 상한입니다."
                    value={monthlyExtraLimitManwon}
                    onChange={setMonthlyExtraLimitManwon}
                    maxValue={MAX_MONTHLY_MANWON}
                    quickAmounts={[{ label: "10만 원", value: 10 }, { label: "30만 원", value: 30 }, { label: "50만 원", value: 50 }]}
                  />
                  <MoneyInput
                    id="upfront-limit"
                    label="지금 사용할 수 있는 여유자금"
                    hint="비상자금과 생활비를 제외한 금액만 입력하세요."
                    value={upfrontLimitManwon}
                    onChange={setUpfrontLimitManwon}
                    maxValue={MAX_CURRENT_MANWON}
                    quickAmounts={[{ label: "0원", value: 0 }, { label: "500만 원", value: 500 }, { label: "1,000만 원", value: 1000 }]}
                  />
                </div>
                <div className="feasibility-actions">
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={(monthlyExtraLimitManwon === null && upfrontLimitManwon === null) || (monthlyExtraLimitManwon ?? 0) > MAX_MONTHLY_MANWON || (upfrontLimitManwon ?? 0) > MAX_CURRENT_MANWON}
                    onClick={applyFeasibilityLimits}
                  >가능 범위로 다시 계산</button>
                  {feasibilityLimits && <button type="button" className="button button--quiet" onClick={clearFeasibilityLimits}>입력 전 계산으로 돌아가기</button>}
                </div>
              </div>
            </details>

            <section id="solutions" className="result-section solution-section" aria-labelledby="solutions-title">
              <div className="section-heading"><div><span className="section-kicker">해결책 3개</span><h2 id="solutions-title">{goalAnalysis.onTrack ? "현재 계획을 활용하는 세 가지 방법" : "부족분을 해결하는 세 가지 방법"}</h2><p>월 적립 확대, 월 적립·시작 자금 조합, 기간 조정 중 하나를 고르면 이번 달 실행 계획으로 바꿔드려요.</p></div></div>
              <div className="solution-grid" role="group" aria-label="목표 날짜 실행안 선택">
                {goalAnalysis.actionPlans.map((plan, index) => {
                  const selected = selectedActionPlan?.id === plan.id;
                  return (
                    <article className={`solution-card solution-card--${plan.id} ${selected ? "solution-card--selected" : ""} ${!plan.feasible ? "solution-card--limited" : ""}`} key={plan.id} aria-label={`${plan.title}${selected ? ", 선택됨" : ""}${!plan.feasible ? ", 현재 조건으로 달성 시점을 계산하기 어려움" : ""}`}>
                      <div className="solution-card__top"><span>방법 {index + 1}</span><div><em>{actionPlanTrait(plan.id, goalAnalysis.onTrack)}</em>{selected && <b>선택됨</b>}</div></div>
                      <h3>{plan.title}</h3>
                      <div className="solution-numbers">
                        <div><small>매달 모을 돈</small><strong>{formatCurrency(plan.monthlyContribution)}</strong></div>
                        <div><small>{plan.id === "timeline" ? "조정한 목표 날짜" : "이번 달 시작 자금"}</small><strong>{plan.id === "timeline" ? formatArrivalDate(plan.adjustedTargetDate) : plan.upfrontAmount > 0 ? formatCurrency(plan.upfrontAmount) : "추가 없음"}</strong></div>
                      </div>
                      <p>{plan.id === "timeline" ? timelineChangeCopy(plan.monthAdjustment) : monthlyChangeCopy(plan.monthlyIncrease)}</p>
                      <div className={`solution-goal-check ${!plan.feasible ? "solution-goal-check--limited" : ""}`}><span aria-hidden="true">{plan.feasible ? "✓" : "!"}</span> {plan.id === "timeline" ? plan.feasible ? `현재 적립 계획으로 ${formatArrivalDate(plan.adjustedTargetDate)} 도달` : "현재 계획으로는 100년 안에 도달하기 어려워요" : plan.feasible ? `${formatArrivalDate(goalAnalysis.targetDate)} 목표 금액 도달` : `목표일에 ${formatCurrency(plan.shortageAtTarget)} 부족`}</div>
                      <button type="button" aria-pressed={selected} onClick={() => selectGoalAction(plan.id)}>
                        {selected ? "이번 달 계획에 적용됨" : plan.id === "timeline" ? "기간 조정안으로 계획 보기" : plan.feasible ? "이 방법으로 계획 보기" : "가능 범위의 최선 계획 보기"}
                      </button>
                    </article>
                  );
                })}
              </div>
              {selectedActionPlan && <div className="solution-feedback" role="status"><span aria-hidden="true">✓</span><strong>{selectedActionPlan.title}</strong> 기준으로 아래 행동 계획이 바뀌었어요.</div>}
              {!selectedActionPlan && <div className="solution-choice-prompt">추천값을 미리 선택하지 않았어요. 세 방법을 비교한 뒤 직접 하나를 선택해 주세요.</div>}
              <p className="solution-note">세 방법은 선택한 목표 날짜와 계산 가정에 따른 산술 예시이며 추천이 아닙니다. 가능 범위를 적용한 방법이 목표에 못 미치면 날짜를 늦추거나 범위를 다시 조정해 주세요.</p>
            </section>

            <section id="monthly-action" className="result-section monthly-action-section" aria-labelledby="monthly-action-title">
              {selectedActionPlan && selectedFirstMonthBalance !== null ? (
                <>
                  <div className="section-heading"><div><span className="section-kicker">이번 달 행동 계획</span><h2 id="monthly-action-title">이번 달은 이렇게 시작하세요</h2><p><strong>{selectedActionPlan.title}</strong>을 선택한 기준입니다.</p></div><button type="button" className="text-action" onClick={copyMonthlyActionPlan}>계획 복사</button></div>
                  <div className="action-progress" aria-live="polite">
                    <div><span>이번 달 진행</span><strong>{completedActionSteps.length}/3 완료</strong></div>
                    <span className="action-progress__track" aria-hidden="true"><span style={{ width: `${(completedActionSteps.length / 3) * 100}%` }} /></span>
                  </div>
                  <ol className="monthly-action-list">
                    {monthlyActionItems.map((item, index) => {
                      const completed = completedActionSteps.includes(index);
                      return (
                        <li className={completed ? "is-complete" : ""} key={item.when}>
                          <label className="action-checkbox">
                            <input type="checkbox" checked={completed} onChange={() => toggleActionStep(index)} aria-label={`${item.when} 행동 완료 표시`} />
                            <span aria-hidden="true">✓</span>
                          </label>
                          <span className="action-when">{item.when}</span>
                          <div><strong>{item.title}</strong><p>{item.description}</p></div>
                        </li>
                      );
                    })}
                  </ol>
                  {completedActionSteps.length === 3 && <div className="action-complete-message" role="status">이번 달 시작 준비를 모두 마쳤어요. 말일에 잔액만 다시 확인해 주세요.</div>}
                </>
              ) : (
                <div className="action-empty">
                  <span className="section-kicker">이번 달 행동 계획</span>
                  <h2 id="monthly-action-title">먼저 실행 방법을 선택해 주세요</h2>
                  <p>추천값을 대신 고르지 않습니다. 위 세 가지 방법 중 내 상황에 맞는 하나를 선택하면 행동 계획이 만들어져요.</p>
                  <a className="button button--primary" href="#solutions">실행안 선택하기</a>
                </div>
              )}
            </section>

            <PolicyBenefitFinder input={baseInput} targetMonths={goalAnalysis.monthsRemaining} />

            <section className="result-section core-inputs" aria-labelledby="inputs-title">
              <div className="section-heading"><div><span className="section-kicker">계산에 쓴 계획</span><h2 id="inputs-title">입력한 조건 한눈에 보기</h2></div><button type="button" className="text-action" onClick={() => { setPhase("wizard"); setStep(1); }}>조건 수정</button></div>
              <div className="input-summary-grid input-summary-grid--four">
                <div><small>목표 금액</small><strong>{formatCurrency(baseInput.goalAmount)}</strong></div>
                <div><small>목표 날짜</small><strong>{formatArrivalDate(goalAnalysis.targetDate)}</strong></div>
                <div><small>지금까지 모은 돈</small><strong>{formatCurrency(baseInput.currentAmount)}</strong></div>
                <div><small>매달 모을 돈</small><strong className={baseInput.monthlyNetFlow < 0 ? "negative" : ""}>{formatCurrency(baseInput.monthlyNetFlow)}</strong></div>
              </div>
            </section>

            <section id="conditions" className="result-section" aria-labelledby="conditions-title">
              <div className="section-heading"><div><span className="section-kicker">조건 바꿔보기</span><h2 id="conditions-title">선택이 부족분을 얼마나 바꿀까요?</h2><p>목표 날짜는 그대로 두고, 최대 세 가지 조건의 부족분 차이를 비교합니다.</p></div></div>
              <div className="condition-chips">
                {conditionPresets.map((preset) => {
                  const selected = selectedConditions.includes(preset.id);
                  return <button type="button" key={preset.id} aria-pressed={selected} onClick={() => {
                    setSelectedConditions((current) => selected ? current.filter((id) => id !== preset.id) : current.length < 3 ? [...current, preset.id] : current);
                    trackEvent("condition_compared", { scenario_type: preset.id });
                  }}>{selected ? "✓ " : "+ "}{preset.label}</button>;
                })}
              </div>
              <div className="comparison-grid">
                {selectedConditions.map((id) => {
                  const preset = conditionPresets.find((item) => item.id === id);
                  if (!preset) return null;
                  const changed = analyzeConditionAtTarget(baseInput, preset, goalAnalysis.targetDate, goalAnalysis.shortage);
                  return (
                    <article className="comparison-card" key={id}>
                      <div><span>선택 {selectedConditions.indexOf(id) + 1}</span><small>{preset.description}</small></div>
                      <h3>{preset.label}</h3>
                      {changed.insufficientFunds
                        ? <strong className="comparison-warning">이 조건에서는 돈이 부족해질 수 있어요</strong>
                        : changed.shortage === 0
                          ? <strong>목표 날짜에 맞출 수 있어요</strong>
                          : <strong className={changed.shortageChange < 0 ? "comparison-warning" : ""}>{shortageChangeCopy(changed.shortageChange)}</strong>}
                      <p>{changed.shortage === 0 ? `예상 여유 ${formatCurrency(changed.surplus)}` : `목표일 부족 ${formatCurrency(changed.shortage)}`}</p>
                    </article>
                  );
                })}
              </div>
              {selectedConditions.length === 0 && <p className="comparison-empty">비교할 조건을 직접 선택해 주세요. 기본으로 적용되는 조건은 없습니다.</p>}
            </section>

            <details className="result-disclosure">
              <summary><span>선택 사항</span><strong id="rate-title">수익률 가정 적용하기</strong><small>현재 연 {annualRate}% · 추천값이 아닌 계산 예시</small></summary>
              <section className="result-section rate-section" aria-labelledby="rate-title">
                <p>첫 결과는 수익률 0%인 원금 기준입니다. 선택하면 부족분과 세 실행안을 함께 다시 계산합니다.</p>
                <div className="rate-buttons" aria-label="연 수익률 가정">
                  {[0, 2, 4, 6].map((rate) => <button type="button" key={rate} aria-pressed={annualRate === rate} onClick={() => { setAnnualRate(rate); setCompletedActionSteps([]); }}>연 {rate}%</button>)}
                </div>
                <p className="assumption-note">수익률 선택지는 계산 예시일 뿐 추천값이 아니며, 실제 시장 결과를 보장하지 않습니다.</p>
              </section>
            </details>

            <details className="result-disclosure">
              <summary><span>상세 보기</span><strong id="details-title">그래프와 계산 내역</strong><small>목표일까지 자산이 쌓이는 예상 경로</small></summary>
              <section className="result-section details-section" aria-labelledby="details-title">
                <p>월말에 적립하고, 선택한 수익률 가정을 매월 복리로 적용했습니다.</p>
                <AssetChart result={result} goalAmount={baseInput.goalAmount} currentAmount={baseInput.currentAmount} horizonMonths={goalAnalysis.monthsRemaining} />
                <details className="calculation-details">
                  <summary>상세 계산 내역 보기</summary>
                  <div className="detail-grid">
                    <div><span>누적 순유입액 (100년 기준)</span><strong>{formatCurrency(result.cumulativeNetFlow)}</strong></div>
                    <div><span>투자손익 가정 (100년 기준)</span><strong>{formatCurrency(result.investmentGain)}</strong></div>
                    <div><span>월 수익률 변환</span><strong>(1 + 연 수익률)<sup>1/12</sup> − 1</strong></div>
                    <div><span>최대 계산 기간</span><strong>1,200개월</strong></div>
                  </div>
                </details>
              </section>
            </details>

            <section className="result-section save-section" aria-labelledby="save-title">
              <div><span className="section-kicker">다음 달에도 이어보기</span><h2 id="save-title">선택한 실행 계획을 저장할까요?</h2><p>{selectedActionPlan ? `'${selectedActionPlan.title}'과 이번 달 체크 상태를 현재 브라우저에 저장합니다.` : "먼저 위 실행안 중 하나를 직접 선택해 주세요."} INVETK 서버로 전송되지 않습니다.</p></div>
              <div className="save-form"><label htmlFor="plan-name">계획 이름</label><div><input id="plan-name" value={planName} maxLength={60} onChange={(event) => setPlanName(event.target.value)} /><button className="button button--primary" type="button" disabled={!selectedActionPlan || !planName.trim()} onClick={handleSave}>{editingPlanId === savedPlan?.id ? "변경 내용 저장" : savedPlan ? "기존 계획 교체" : "계획 저장"}</button></div></div>
            </section>

            {savedPlan && editingPlanId === savedPlan.id && (
              <section className="result-section update-section" aria-labelledby="update-title">
                <div className="section-heading"><div><span className="section-kicker">저장된 계획 전용</span><h2 id="update-title">이번 달 업데이트</h2><p>현재 자산을 바꾸고, 목표 날짜까지 예상 부족분이 얼마나 달라졌는지 확인하세요.</p></div><button className="text-action" type="button" onClick={() => { setUpdateOpen(!updateOpen); setUpdateAmount(wonToManwon(savedPlan.currentAmount)); }}>{updateOpen ? "닫기" : "업데이트하기"}</button></div>
                {updateOpen && <div className="update-form"><MoneyInput id="update-amount" label="이번 달 지금까지 모은 돈" hint="오늘 기준으로 목표에 사용할 수 있는 금액을 입력하세요." value={updateAmount} onChange={setUpdateAmount} maxValue={MAX_CURRENT_MANWON} quickAmounts={[{ label: "+30만 원", value: wonToManwon(savedPlan.currentAmount) + 30 }, { label: "+50만 원", value: wonToManwon(savedPlan.currentAmount) + 50 }, { label: "+100만 원", value: wonToManwon(savedPlan.currentAmount) + 100 }]} /><label htmlFor="update-memo">메모 (선택)</label><input id="update-memo" value={updateMemo} maxLength={300} onChange={(event) => setUpdateMemo(event.target.value)} placeholder="이번 달에 달라진 점" /><button className="button button--primary" type="button" disabled={updateAmount === null || updateAmount > MAX_CURRENT_MANWON} onClick={handleMonthlyUpdate}>이번 달 기록 저장</button></div>}
                {savedPlan.checkins.length > 0 && <div className="checkin-list"><h3>최근 기록</h3>{savedPlan.checkins.slice(-3).reverse().map((checkin) => <div key={checkin.date}><span>{new Date(checkin.date).toLocaleDateString("ko-KR")}</span><strong>{checkin.shortageDifference === null ? "새 부족분 기준" : checkin.shortage === 0 ? "목표 날짜에 맞출 수 있음" : shortageChangeCopy(checkin.shortageDifference)}</strong></div>)}</div>}
              </section>
            )}

            <details className="result-disclosure result-disclosure--dark">
              <summary><span>결과 활용</span><strong>공유와 데이터 관리</strong><small>공유 문장에는 개인 금액을 넣지 않아요</small></summary>
              <section className="result-actions" aria-label="결과 공유와 데이터 관리">
                <div><h2>결과 활용하기</h2><p>공유 기능에는 소득, 자산, 목표 금액을 넣지 않아요.</p></div>
                <div className="action-buttons">
                  <button className="button button--quiet" type="button" onClick={copyResult}>결과 문장 복사</button>
                  <button className="button button--quiet" type="button" onClick={shareResult}>기기로 공유</button>
                  <button className="button button--quiet" type="button" onClick={createShareCard}>공유 카드 만들기</button>
                  {savedPlan && (
                    <>
                      <button className="button button--quiet" type="button" onClick={downloadBackup}>데이터 백업</button>
                      <button className="button button--quiet" type="button" onClick={() => importRef.current?.click()}>백업 불러오기</button>
                    </>
                  )}
                </div>
                {savedPlan && <button className="delete-action" type="button" onClick={removeLocalData}>이 브라우저의 저장 데이터 삭제</button>}
              </section>
            </details>

            <div className="disclaimer">본 결과는 입력한 값과 가정을 바탕으로 계산한 참고용 예상치입니다. 실제 수익, 세금, 수수료, 물가, 소득과 지출은 달라질 수 있습니다. 정책 혜택의 대상 가능성은 간이 확인이며 최종 가입 자격과 지급액은 공식 심사를 따라야 합니다. INVETK는 특정 금융상품의 가입·매수·매도를 권유하지 않습니다.</div>
            <button className="restart-button" type="button" onClick={() => { setPhase("wizard"); setStep(1); setAnnualRate(0); setSelectedAction(null); setCompletedActionSteps([]); setFeasibilityLimits(null); setMonthlyExtraLimitManwon(null); setUpfrontLimitManwon(null); setEditingPlanId(null); }}>처음부터 다시 계산</button>
          </div>
        ) : null}
      </section>

      {cashflowHelperOpen && <CashflowHelper onClose={() => setCashflowHelperOpen(false)} onComplete={(monthlyFlow, values) => { setMonthlyManwon(monthlyFlow); setCashflowValues(values); setCashflowHelperOpen(false); }} />}

      {phase === "intro" && (
        <section id="how" className="how-section">
          <div className="section-heading section-heading--center"><div><span className="section-kicker">Money GPS 사용법</span><h2>진단하고, 세 가지 해결책을 비교해요</h2></div></div>
          <div className="how-grid">
            <article><span>01</span><h3>목표를 날짜로 정하기</h3><p>언제까지 얼마가 필요한지 목적지를 정해요.</p></article>
            <article><span>02</span><h3>현재 계획 진단하기</h3><p>그날 예상 금액과 부족분을 바로 계산해요.</p></article>
            <article><span>03</span><h3>이번 달부터 실행하기</h3><p>세 가지 방법 중 하나를 골라 행동 계획으로 바꿔요.</p></article>
          </div>
          <div className="question-cloud"><span>5년 뒤 1억에 얼마나 부족할까?</span><span>매달 얼마를 더 모아야 할까?</span><span>목돈과 월 적립을 나누면?</span><span>이번 달엔 무엇부터 해야 할까?</span></div>
        </section>
      )}

      <input className="visually-hidden" ref={importRef} type="file" accept="application/json" onChange={handleImport} />
      <div className="toast" role="status" aria-live="polite">{statusMessage}</div>
    </main>
  );
}
