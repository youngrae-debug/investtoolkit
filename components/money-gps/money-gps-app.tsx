"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatCurrency, manwonToWon, wonToManwon } from "@/lib/format/currency";
import { formatArrivalDate, compareArrivalDates } from "@/lib/format/date";
import { formatDuration, formatMonthDifference } from "@/lib/format/duration";
import {
  calculateMonthlyNetFlow,
  monthDifference,
  simulatePlan,
} from "@/lib/simulation/engine";
import {
  conditionPresets,
  simulateCondition,
  type ConditionPresetId,
} from "@/lib/simulation/scenarios";
import type { CashflowInput, SimulationInput, SimulationResult } from "@/lib/simulation/types";
import {
  deleteSavedPlan,
  exportBackup,
  importBackup,
  loadSavedPlan,
  savePlan,
  SCHEMA_VERSION,
  type SavedPlan,
} from "@/lib/storage/plans";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type Phase = "intro" | "wizard" | "result";

interface MoneyGpsAppProps {
  autoStart?: boolean;
}

interface QuickAmount {
  label: string;
  value: number;
}

function trackEvent(eventName: string, properties: Record<string, string | number> = {}) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ event: eventName, page_path: window.location.pathname, ...properties });
}

function MoneyInput({
  id,
  label,
  hint,
  value,
  onChange,
  quickAmounts,
  readOnly = false,
}: {
  id: string;
  label: string;
  hint: string;
  value: number | null;
  onChange: (value: number | null) => void;
  quickAmounts: QuickAmount[];
  readOnly?: boolean;
}) {
  const displayedValue = value === null ? "" : value.toLocaleString("ko-KR");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const cleaned = event.target.value.replace(/[^0-9]/g, "");
    onChange(cleaned === "" ? null : Number(cleaned));
  }

  return (
    <div className="money-input-group">
      <label htmlFor={id}>{label}</label>
      <p id={`${id}-hint`}>{hint}</p>
      <div className={`money-input ${readOnly ? "money-input--readonly" : ""}`}>
        <input
          id={id}
          aria-describedby={`${id}-hint`}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={displayedValue}
          onChange={handleChange}
          readOnly={readOnly}
        />
        <span>만 원</span>
      </div>
      {!readOnly && (
        <div className="quick-amounts" aria-label={`${label} 빠른 선택`}>
          {quickAmounts.map((amount) => (
            <button
              type="button"
              key={amount.value}
              onClick={() => onChange(amount.value)}
              aria-pressed={value === amount.value}
            >
              {amount.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <div className="progress-wrap" aria-label={`계산 진행 ${current}/3`}>
      <div className="progress-copy"><span>첫 계산</span><strong>{current}/3</strong></div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(current / 3) * 100}%` }} />
      </div>
    </div>
  );
}

const helperQuestions: Array<{
  key: keyof CashflowInput;
  label: string;
  hint: string;
  quick: QuickAmount[];
}> = [
  {
    key: "monthlyNetIncome",
    label: "한 달 실수령액은 얼마인가요?",
    hint: "통장에 실제로 들어오는 월급을 입력하세요.",
    quick: [{ label: "250만 원", value: 250 }, { label: "350만 원", value: 350 }, { label: "500만 원", value: 500 }],
  },
  {
    key: "fixedExpenses",
    label: "한 달 고정비는 얼마인가요?",
    hint: "월세, 관리비, 통신비, 보험료처럼 정기적인 지출입니다.",
    quick: [{ label: "50만 원", value: 50 }, { label: "100만 원", value: 100 }, { label: "150만 원", value: 150 }],
  },
  {
    key: "livingExpenses",
    label: "한 달 생활비는 얼마인가요?",
    hint: "식비, 교통비, 쇼핑 등 평균 생활비를 입력하세요.",
    quick: [{ label: "50만 원", value: 50 }, { label: "100만 원", value: 100 }, { label: "150만 원", value: 150 }],
  },
  {
    key: "debtPayments",
    label: "한 달 대출 상환액은 얼마인가요?",
    hint: "없다면 0원을 선택해도 됩니다.",
    quick: [{ label: "0원", value: 0 }, { label: "30만 원", value: 30 }, { label: "50만 원", value: 50 }],
  },
];

function CashflowHelper({
  onComplete,
  onClose,
}: {
  onComplete: (monthlyNetFlowManwon: number, values: CashflowInput) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<keyof CashflowInput, number | null>>({
    monthlyNetIncome: null,
    fixedExpenses: null,
    livingExpenses: null,
    debtPayments: 0,
  });
  const question = helperQuestions[index];
  const value = values[question.key];

  function next() {
    if (value === null) return;
    if (index < helperQuestions.length - 1) {
      setIndex(index + 1);
      return;
    }
    const completeValues: CashflowInput = {
      monthlyNetIncome: manwonToWon(values.monthlyNetIncome ?? 0),
      fixedExpenses: manwonToWon(values.fixedExpenses ?? 0),
      livingExpenses: manwonToWon(values.livingExpenses ?? 0),
      debtPayments: manwonToWon(values.debtPayments ?? 0),
    };
    onComplete(wonToManwon(calculateMonthlyNetFlow(completeValues)), completeValues);
  }

  return (
    <div className="helper-overlay" role="dialog" aria-modal="true" aria-labelledby="helper-title">
      <div className="helper-card">
        <button className="helper-close" type="button" onClick={onClose} aria-label="계산 도우미 닫기">×</button>
        <div className="helper-progress">월급과 지출로 계산하기 <strong>{index + 1}/4</strong></div>
        <h2 id="helper-title">{question.label}</h2>
        <MoneyInput
          id={`helper-${question.key}`}
          label={question.label}
          hint={question.hint}
          value={value}
          onChange={(nextValue) => setValues({ ...values, [question.key]: nextValue })}
          quickAmounts={question.quick}
        />
        <div className="wizard-actions">
          <button type="button" className="button button--quiet" onClick={() => index === 0 ? onClose() : setIndex(index - 1)}>
            이전
          </button>
          <button type="button" className="button button--primary" disabled={value === null} onClick={next}>
            {index === helperQuestions.length - 1 ? "매달 모을 돈 계산" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetChart({ result, goalAmount, currentAmount }: { result: SimulationResult; goalAmount: number; currentAmount: number }) {
  const horizon = Math.max(1, Math.min(result.monthsToGoal ?? 120, 120));
  const points = Array.from({ length: 9 }, (_, index) => {
    if (index === 0) return { month: 0, balance: currentAmount };
    const month = Math.max(1, Math.round((horizon * index) / 8));
    return { month, balance: result.timeline[month - 1]?.closingBalance ?? 0 };
  });
  const maxValue = Math.max(goalAmount, ...points.map((point) => point.balance), 1);

  return (
    <div className="asset-chart" role="img" aria-label={`현재 ${formatCurrency(currentAmount)}에서 ${horizon}개월 동안의 예상 자산 변화`}>
      <div className="chart-goal"><span>목표 {formatCurrency(goalAmount)}</span></div>
      <div className="chart-bars" aria-hidden="true">
        {points.map((point) => (
          <div className="chart-bar-wrap" key={point.month}>
            <span className="chart-bar" style={{ height: `${Math.max(4, (point.balance / maxValue) * 86)}%` }} />
            <small>{point.month === 0 ? "지금" : `${point.month}개월`}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function DifferenceCopy({ difference }: { difference: number | null }) {
  if (difference === null) return <strong>도달 여부가 달라져요</strong>;
  if (difference === 0) return <strong>목표일 변화 없음</strong>;
  return <strong>{formatMonthDifference(difference)} {difference > 0 ? "빨라져요" : "늦어져요"}</strong>;
}

export function MoneyGpsApp({ autoStart = false }: MoneyGpsAppProps) {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>(autoStart ? "wizard" : "intro");
  const [step, setStep] = useState(1);
  const [goalManwon, setGoalManwon] = useState<number | null>(null);
  const [currentManwon, setCurrentManwon] = useState<number | null>(null);
  const [monthlyManwon, setMonthlyManwon] = useState<number | null>(null);
  const [annualRate, setAnnualRate] = useState(0);
  const [cashflowHelperOpen, setCashflowHelperOpen] = useState(false);
  const [cashflowValues, setCashflowValues] = useState<CashflowInput | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<ConditionPresetId[]>(["monthly-100k"]);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
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
          setCurrentManwon(values[1]);
          setMonthlyManwon(values[2]);
          if (values[3]) setSelectedConditions([values[3]]);
        }
      }
    });
  }, [autoStart]);

  const baseInput = useMemo<SimulationInput | null>(() => {
    if (goalManwon === null || currentManwon === null || monthlyManwon === null) return null;
    return {
      goalAmount: manwonToWon(goalManwon),
      currentAmount: manwonToWon(currentManwon),
      monthlyNetFlow: manwonToWon(monthlyManwon),
      annualRate,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      planningMode: cashflowValues ? "cashflow" : "direct",
    };
  }, [annualRate, cashflowValues, currentManwon, goalManwon, monthlyManwon]);

  const result = useMemo(() => baseInput ? simulatePlan(baseInput) : null, [baseInput]);

  function scrollToCalculator() {
    requestAnimationFrame(() => calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function startCalculation() {
    setPhase("wizard");
    setStep(1);
    trackEvent("gps_started");
    scrollToCalculator();
  }

  function nextStep() {
    if (step === 1 && (goalManwon === null || goalManwon <= 0)) return;
    if (step === 2 && (currentManwon === null || currentManwon < 0)) return;
    trackEvent("gps_step_completed", { step_number: step });
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (monthlyManwon === null) return;
    setAnnualRate(0);
    setPhase("result");
    trackEvent("gps_calculation_completed", { result_status: monthlyManwon >= 0 ? "calculated" : "negative_flow" });
    scrollToCalculator();
  }

  function loadPlan(plan: SavedPlan, openUpdate = false) {
    setGoalManwon(wonToManwon(plan.goalAmount));
    setCurrentManwon(wonToManwon(plan.currentAmount));
    setMonthlyManwon(wonToManwon(plan.monthlyContribution));
    setAnnualRate(plan.annualRate);
    setCashflowValues(null);
    setPhase("result");
    setUpdateAmount(wonToManwon(plan.currentAmount));
    setUpdateOpen(openUpdate);
    scrollToCalculator();
  }

  function handleSave() {
    if (!baseInput || !result || !planName.trim()) return;
    const plan: SavedPlan = {
      schemaVersion: SCHEMA_VERSION,
      id: savedPlan?.id ?? (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
      name: planName.trim(),
      savedAt: new Date().toISOString(),
      goalAmount: baseInput.goalAmount,
      currentAmount: baseInput.currentAmount,
      monthlyContribution: baseInput.monthlyNetFlow,
      annualRate: baseInput.annualRate,
      arrivalDate: result.arrivalDate?.toISOString() ?? null,
      checkins: savedPlan?.checkins ?? [],
    };
    setSavedPlan(savePlan(plan));
    setStatusMessage("계획을 이 브라우저에 저장했어요.");
    trackEvent("plan_saved");
  }

  function handleMonthlyUpdate() {
    if (!savedPlan || updateAmount === null) return;
    const updatedInput: SimulationInput = {
      goalAmount: savedPlan.goalAmount,
      currentAmount: manwonToWon(updateAmount),
      monthlyNetFlow: savedPlan.monthlyContribution,
      annualRate: savedPlan.annualRate,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    };
    const updatedResult = simulatePlan(updatedInput);
    const difference = savedPlan.arrivalDate && updatedResult.arrivalDate
      ? compareArrivalDates(new Date(savedPlan.arrivalDate), updatedResult.arrivalDate)
      : null;
    const updatedPlan: SavedPlan = {
      ...savedPlan,
      savedAt: new Date().toISOString(),
      currentAmount: updatedInput.currentAmount,
      arrivalDate: updatedResult.arrivalDate?.toISOString() ?? null,
      checkins: [
        ...savedPlan.checkins,
        {
          date: new Date().toISOString(),
          currentAmount: updatedInput.currentAmount,
          arrivalDate: updatedResult.arrivalDate?.toISOString() ?? null,
          differenceMonths: difference,
          memo: updateMemo.trim(),
        },
      ],
    };
    setSavedPlan(savePlan(updatedPlan));
    setCurrentManwon(updateAmount);
    setUpdateOpen(false);
    setUpdateMemo("");
    setStatusMessage(
      difference === null
        ? "이번 달 값으로 계획을 업데이트했어요."
        : difference === 0
          ? "목표일은 지난 점검과 같아요."
          : `목표일이 지난 점검보다 ${formatMonthDifference(difference)} ${difference > 0 ? "빨라졌어요" : "늦어졌어요"}.`,
    );
    trackEvent("monthly_update_saved");
  }

  async function copyResult() {
    if (!result) return;
    const copy = result.monthsToGoal === null
      ? "현재 조건에서는 계산 범위 안에 목표 도착을 확인하기 어려워요.\n\nINVETK Money GPS"
      : `내 목표까지 약 ${formatDuration(result.monthsToGoal)}, 예상 도착은 ${formatArrivalDate(result.arrivalDate)}입니다.\n\nINVETK Money GPS`;
    await navigator.clipboard.writeText(copy);
    setStatusMessage("개인 금액을 제외한 결과를 복사했어요.");
    trackEvent("result_copied");
  }

  async function shareResult() {
    if (!result) return;
    const text = result.monthsToGoal === null
      ? "내 자산 목표 경로를 INVETK Money GPS에서 확인했어요."
      : `내 목표까지 약 ${formatDuration(result.monthsToGoal)}, 예상 도착은 ${formatArrivalDate(result.arrivalDate)}입니다.\n\nINVETK Money GPS`;
    if (navigator.share) {
      await navigator.share({ title: "INVETK Money GPS", text, url: "https://invetk.com" });
      trackEvent("web_share_used");
      return;
    }
    await navigator.clipboard.writeText(text);
    setStatusMessage("공유할 문장을 복사했어요.");
  }

  function createShareCard() {
    if (!result) return;
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
    context.fillText(result.monthsToGoal === null ? "목표 경로를 다시 확인해요" : `목표까지 ${formatDuration(result.monthsToGoal)}`, 72, 280);
    context.fillStyle = "#0b8275";
    context.font = "600 42px sans-serif";
    context.fillText(result.arrivalDate ? `예상 도착 ${formatArrivalDate(result.arrivalDate)}` : "조건을 바꾸면 도착 가능성을 비교할 수 있어요", 72, 370);
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
    setStatusMessage("이 브라우저에 저장된 데이터를 모두 삭제했어요.");
    trackEvent("local_data_deleted");
  }

  const currentValid = step === 1
    ? goalManwon !== null && goalManwon > 0
    : step === 2
      ? currentManwon !== null && currentManwon >= 0
      : monthlyManwon !== null;

  return (
    <main id="main-content" data-hydrated={hydrated}>
      {!autoStart && phase === "intro" && (
        <>
          <section className="hero">
            <div className="hero__copy">
              <div className="eyebrow"><span /> 돈의 목적지를 시간으로</div>
              <h1>내 돈의 목적지,<br /><em>언제 도착할까요?</em></h1>
              <p>목표 금액, 지금까지 모은 돈, 매달 모을 돈. 딱 세 가지만 알려주면 원금 기준 예상 도착일을 보여드려요.</p>
              <div className="hero__actions">
                <button className="button button--primary button--large" type="button" disabled={!hydrated} onClick={startCalculation}>내 목표일 계산하기 <span aria-hidden="true">→</span></button>
                <a className="button button--text" href="#how">어떻게 계산하나요?</a>
              </div>
              <ul className="hero__proof" aria-label="서비스 특징">
                <li>3개 질문</li><li>가입 없이</li><li>약 60초</li>
              </ul>
            </div>
            <div className="route-card" aria-label="계산 예시">
              <div className="route-card__top"><span>예시 경로</span><small>수익률 0%</small></div>
              <div className="route-line" aria-hidden="true">
                <span className="route-dot route-dot--start" /><span className="route-path" /><span className="route-dot route-dot--end" />
              </div>
              <div className="route-points">
                <div><small>지금</small><strong>3,000만 원</strong></div>
                <div><small>매달</small><strong>100만 원</strong></div>
                <div><small>목표</small><strong>1억 원</strong></div>
              </div>
              <div className="route-arrival"><span>예상 소요 기간</span><strong>5년 10개월</strong></div>
              <p>예시 값은 기능 설명용이며 추천값이 아닙니다.</p>
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
            <h2 id="calculator-title">세 번 답하면 목표일이 보여요</h2>
            <div className="preview-steps">
              <div><b>01</b><span>목표 금액</span></div><div><b>02</b><span>지금까지 모은 돈</span></div><div><b>03</b><span>매달 모을 돈</span></div>
            </div>
            <button className="button button--primary" type="button" disabled={!hydrated} onClick={startCalculation}>첫 질문 시작하기</button>
          </div>
        ) : phase === "wizard" ? (
          <div className="wizard-card" onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => { if (event.key === "Enter" && currentValid) nextStep(); }}>
            <Progress current={step} />
            <div className="wizard-heading">
              <span className="section-kicker">{step === 1 ? "목적지" : step === 2 ? "현재 위치" : "이동 속도"}</span>
              <h1 id="calculator-title">{step === 1 ? "목표 금액은 얼마인가요?" : step === 2 ? "지금까지 모은 돈은 얼마인가요?" : "매달 얼마를 모을 수 있나요?"}</h1>
              <p>{step === 1 ? "가장 먼저 도착하고 싶은 자산 목표를 적어보세요." : step === 2 ? "예금과 투자자산 등 목표에 쓸 수 있는 돈을 합쳐보세요." : "월급날마다 꾸준히 더할 수 있는 금액을 적어보세요."}</p>
            </div>
            {step === 1 && (
              <MoneyInput id="goal-amount" label="목표 금액" hint="1억 원이라면 10,000을 입력하세요." value={goalManwon} onChange={setGoalManwon} quickAmounts={[{ label: "3,000만 원", value: 3000 }, { label: "5,000만 원", value: 5000 }, { label: "1억 원", value: 10000 }]} />
            )}
            {step === 2 && (
              <MoneyInput id="current-amount" label="지금까지 모은 돈" hint="아직 시작 전이라면 0원도 괜찮아요." value={currentManwon} onChange={setCurrentManwon} quickAmounts={[{ label: "0원", value: 0 }, { label: "500만 원", value: 500 }, { label: "1,000만 원", value: 1000 }, { label: "3,000만 원", value: 3000 }]} />
            )}
            {step === 3 && (
              <>
                <MoneyInput id="monthly-amount" label={cashflowValues ? "계산된 매달 모을 돈" : "매달 모을 돈"} hint={cashflowValues ? "월 실수령액에서 고정비, 생활비, 대출 상환액을 뺀 금액입니다." : "투자수익은 빼고, 순수하게 매달 더할 원금을 입력하세요."} value={monthlyManwon} onChange={(value) => { setMonthlyManwon(value); setCashflowValues(null); }} quickAmounts={[{ label: "30만 원", value: 30 }, { label: "50만 원", value: 50 }, { label: "100만 원", value: 100 }]} readOnly={Boolean(cashflowValues)} />
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
              <button type="button" className="button button--primary" onClick={nextStep} disabled={!currentValid}>{step === 3 ? "목표일 확인하기" : "다음"} <span aria-hidden="true">→</span></button>
            </div>
            <p className="privacy-note"><span aria-hidden="true">●</span> 입력한 금액은 서버로 전송되지 않아요.</p>
          </div>
        ) : result && baseInput ? (
          <div className="results" aria-live="polite">
            <div className="result-hero">
              <div className="result-route-label"><span className="pulse-dot" /> 원금 기준 경로 · 연 {annualRate}% 가정</div>
              <p>목표까지 남은 기간</p>
              <h1 id="calculator-title">{formatDuration(result.monthsToGoal)}</h1>
              <div className="arrival-box"><span>예상 도착 연월</span><strong>{formatArrivalDate(result.arrivalDate)}</strong></div>
              {result.status === "insufficient_funds" && (
                <div className="warning-box"><strong>이 계획을 유지하면 돈이 부족해질 수 있어요</strong><p>{result.insufficientMonth}개월 뒤 약 {formatCurrency(result.insufficientAmount ?? 0)}이 부족해질 수 있습니다.</p></div>
              )}
              {result.status === "not_reached" && (
                <div className="warning-box"><strong>현재 조건에서는 100년 안에 목표 도착을 확인하기 어려워요.</strong><p>매달 모을 돈을 바꿔 도착 가능성을 비교해 보세요.</p></div>
              )}
            </div>

            <section className="result-section core-inputs" aria-labelledby="inputs-title">
              <div className="section-heading"><div><span className="section-kicker">계산에 쓴 세 가지</span><h2 id="inputs-title">내 경로 한눈에 보기</h2></div><button type="button" className="text-action" onClick={() => { setPhase("wizard"); setStep(1); }}>금액 수정</button></div>
              <div className="input-summary-grid">
                <div><small>목표 금액</small><strong>{formatCurrency(baseInput.goalAmount)}</strong></div>
                <div><small>지금까지 모은 돈</small><strong>{formatCurrency(baseInput.currentAmount)}</strong></div>
                <div><small>매달 모을 돈</small><strong className={baseInput.monthlyNetFlow < 0 ? "negative" : ""}>{formatCurrency(baseInput.monthlyNetFlow)}</strong></div>
              </div>
            </section>

            <section id="conditions" className="result-section" aria-labelledby="conditions-title">
              <div className="section-heading"><div><span className="section-kicker">조건 바꿔보기</span><h2 id="conditions-title">선택이 시간을 얼마나 바꿀까요?</h2><p>최대 세 가지를 골라 현재 계획과 비교할 수 있어요.</p></div></div>
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
                  const changed = simulateCondition(baseInput, preset);
                  const difference = monthDifference(result.monthsToGoal, changed.monthsToGoal);
                  return (
                    <article className="comparison-card" key={id}>
                      <div><span>선택 {selectedConditions.indexOf(id) + 1}</span><small>{preset.description}</small></div>
                      <h3>{preset.label}</h3>
                      {changed.status === "insufficient_funds" ? <strong className="comparison-warning">자금 부족 가능</strong> : <DifferenceCopy difference={difference} />}
                      <p>{formatArrivalDate(changed.arrivalDate)}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="result-section rate-section" aria-labelledby="rate-title">
              <div className="section-heading"><div><span className="section-kicker">선택 사항</span><h2 id="rate-title">수익률 가정 적용하기</h2><p>첫 결과는 수익률 0%인 원금 기준입니다. 원하면 계산 가정만 바꿔볼 수 있어요.</p></div></div>
              <div className="rate-buttons" aria-label="연 수익률 가정">
                {[0, 2, 4, 6].map((rate) => <button type="button" key={rate} aria-pressed={annualRate === rate} onClick={() => setAnnualRate(rate)}>연 {rate}%</button>)}
              </div>
              <p className="assumption-note">수익률 선택지는 계산 예시일 뿐 추천값이 아니며, 실제 시장 결과를 보장하지 않습니다.</p>
            </section>

            <section className="result-section details-section" aria-labelledby="details-title">
              <div className="section-heading"><div><span className="section-kicker">상세 보기</span><h2 id="details-title">자산이 쌓이는 예상 경로</h2><p>월말에 적립하고, 선택한 수익률 가정을 매월 복리로 적용했습니다.</p></div></div>
              <AssetChart result={result} goalAmount={baseInput.goalAmount} currentAmount={baseInput.currentAmount} />
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

            <section className="result-section save-section" aria-labelledby="save-title">
              <div><span className="section-kicker">다음 달에도 이어보기</span><h2 id="save-title">이 계획을 브라우저에 저장할까요?</h2><p>계획은 현재 브라우저에만 저장되며 INVETK 서버로 전송되지 않습니다.</p></div>
              <div className="save-form"><label htmlFor="plan-name">계획 이름</label><div><input id="plan-name" value={planName} maxLength={60} onChange={(event) => setPlanName(event.target.value)} /><button className="button button--primary" type="button" onClick={handleSave}>계획 저장</button></div></div>
            </section>

            {savedPlan && (
              <section className="result-section update-section" aria-labelledby="update-title">
                <div className="section-heading"><div><span className="section-kicker">저장된 계획 전용</span><h2 id="update-title">이번 달 업데이트</h2><p>현재 자산을 바꾸고, 지난 점검과 목표일 차이를 확인하세요.</p></div><button className="text-action" type="button" onClick={() => { setUpdateOpen(!updateOpen); setUpdateAmount(wonToManwon(savedPlan.currentAmount)); }}>{updateOpen ? "닫기" : "업데이트하기"}</button></div>
                {updateOpen && <div className="update-form"><MoneyInput id="update-amount" label="이번 달 지금까지 모은 돈" hint="오늘 기준으로 목표에 사용할 수 있는 금액을 입력하세요." value={updateAmount} onChange={setUpdateAmount} quickAmounts={[{ label: "+30만 원", value: wonToManwon(savedPlan.currentAmount) + 30 }, { label: "+50만 원", value: wonToManwon(savedPlan.currentAmount) + 50 }, { label: "+100만 원", value: wonToManwon(savedPlan.currentAmount) + 100 }]} /><label htmlFor="update-memo">메모 (선택)</label><input id="update-memo" value={updateMemo} maxLength={300} onChange={(event) => setUpdateMemo(event.target.value)} placeholder="이번 달에 달라진 점" /><button className="button button--primary" type="button" disabled={updateAmount === null} onClick={handleMonthlyUpdate}>이번 달 기록 저장</button></div>}
                {savedPlan.checkins.length > 0 && <div className="checkin-list"><h3>최근 기록</h3>{savedPlan.checkins.slice(-3).reverse().map((checkin) => <div key={checkin.date}><span>{new Date(checkin.date).toLocaleDateString("ko-KR")}</span><strong>{checkin.differenceMonths === null ? "새 기준" : checkin.differenceMonths === 0 ? "변화 없음" : `${formatMonthDifference(checkin.differenceMonths)} ${checkin.differenceMonths > 0 ? "빨라짐" : "늦어짐"}`}</strong></div>)}</div>}
              </section>
            )}

            <section className="result-actions" aria-label="결과 공유와 데이터 관리">
              <div><h2>결과 활용하기</h2><p>공유 기능에는 소득, 자산, 목표 금액을 넣지 않아요.</p></div>
              <div className="action-buttons"><button className="button button--quiet" type="button" onClick={copyResult}>결과 문장 복사</button><button className="button button--quiet" type="button" onClick={shareResult}>기기로 공유</button><button className="button button--quiet" type="button" onClick={createShareCard}>공유 카드 만들기</button>{savedPlan && <><button className="button button--quiet" type="button" onClick={downloadBackup}>데이터 백업</button><button className="button button--quiet" type="button" onClick={() => importRef.current?.click()}>백업 불러오기</button><input className="visually-hidden" ref={importRef} type="file" accept="application/json" onChange={handleImport} /></>} </div>
              {savedPlan && <button className="delete-action" type="button" onClick={removeLocalData}>이 브라우저의 저장 데이터 삭제</button>}
            </section>

            <div className="disclaimer">본 결과는 입력한 값과 가정을 바탕으로 계산한 참고용 예상치입니다. 실제 수익, 세금, 수수료, 물가, 소득과 지출은 달라질 수 있습니다. INVETK는 특정 금융상품의 가입·매수·매도를 권유하지 않습니다.</div>
            <button className="restart-button" type="button" onClick={() => { setPhase("wizard"); setStep(1); setAnnualRate(0); }}>처음부터 다시 계산</button>
          </div>
        ) : null}
      </section>

      {cashflowHelperOpen && <CashflowHelper onClose={() => setCashflowHelperOpen(false)} onComplete={(monthlyFlow, values) => { setMonthlyManwon(monthlyFlow); setCashflowValues(values); setCashflowHelperOpen(false); }} />}

      {phase === "intro" && (
        <section id="how" className="how-section">
          <div className="section-heading section-heading--center"><div><span className="section-kicker">Money GPS 사용법</span><h2>금액보다 먼저, 시간을 보여드려요</h2></div></div>
          <div className="how-grid">
            <article><span>01</span><h3>현재 위치</h3><p>지금까지 모은 돈을 확인해요.</p></article>
            <article><span>02</span><h3>목적지</h3><p>내가 원하는 목표 금액을 정해요.</p></article>
            <article><span>03</span><h3>예상 도착일</h3><p>매달 모을 돈으로 남은 시간을 계산해요.</p></article>
          </div>
          <div className="question-cloud"><span>월 100만 원씩 모으면 1억까지?</span><span>생활비를 20만 원 줄이면?</span><span>자동차를 지금 사면?</span><span>6개월 쉬어도 괜찮을까?</span></div>
        </section>
      )}

      <div className="toast" role="status" aria-live="polite">{statusMessage}</div>
    </main>
  );
}
