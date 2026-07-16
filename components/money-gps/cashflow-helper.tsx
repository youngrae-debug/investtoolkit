"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { manwonToWon, wonToManwon } from "@/lib/format/currency";
import { calculateMonthlyNetFlow } from "@/lib/simulation/engine";
import type { CashflowInput } from "@/lib/simulation/types";
import { MAX_MONTHLY_MANWON } from "./constants";
import { MoneyInput, type QuickAmount } from "./money-input";

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

interface CashflowHelperProps {
  onComplete: (monthlyNetFlowManwon: number, values: CashflowInput) => void;
  onClose: () => void;
}

export function CashflowHelper({ onComplete, onClose }: CashflowHelperProps) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<keyof CashflowInput, number | null>>({
    monthlyNetIncome: null,
    fixedExpenses: null,
    livingExpenses: null,
    debtPayments: 0,
  });
  const question = helperQuestions[index];
  const value = values[question.key];
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLInputElement>(`#helper-${question.key}`)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [question.key]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

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
    <div className="helper-overlay">
      <div
        ref={dialogRef}
        className="helper-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="helper-title"
        onKeyDown={handleKeyDown}
      >
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
          maxValue={MAX_MONTHLY_MANWON}
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
