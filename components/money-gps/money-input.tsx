import type { ChangeEvent } from "react";
import { formatCurrency, manwonToWon } from "@/lib/format/currency";
import { MAX_CURRENT_MANWON } from "./constants";

export interface QuickAmount {
  label: string;
  value: number;
}

interface MoneyInputProps {
  id: string;
  label: string;
  hint: string;
  value: number | null;
  onChange: (value: number | null) => void;
  quickAmounts: QuickAmount[];
  maxValue?: number;
  readOnly?: boolean;
}

export function MoneyInput({
  id,
  label,
  hint,
  value,
  onChange,
  quickAmounts,
  maxValue = MAX_CURRENT_MANWON,
  readOnly = false,
}: MoneyInputProps) {
  const displayedValue = value === null ? "" : value.toLocaleString("ko-KR");
  const readableAmount = value === null
    ? "금액을 입력하면 원 단위로 확인할 수 있어요."
    : formatCurrency(manwonToWon(value));
  const inputError = !readOnly && value !== null && value > maxValue
    ? `최대 ${formatCurrency(manwonToWon(maxValue))}까지 입력할 수 있어요.`
    : "";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const cleaned = event.target.value.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      onChange(null);
      return;
    }
    const parsed = Number(cleaned);
    onChange(Number.isSafeInteger(parsed) ? Math.min(parsed, maxValue + 1) : maxValue + 1);
  }

  return (
    <div className="money-input-group">
      <label htmlFor={id}>{label}</label>
      <p id={`${id}-hint`}>{hint}</p>
      <div className={`money-input ${readOnly ? "money-input--readonly" : ""}`}>
        <input
          id={id}
          aria-describedby={`${id}-hint ${id}-readable${inputError ? ` ${id}-error` : ""}`}
          aria-invalid={Boolean(inputError)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={displayedValue}
          onChange={handleChange}
          readOnly={readOnly}
        />
        <span>만 원</span>
      </div>
      <p className={`money-input-readable ${value === null ? "money-input-readable--empty" : ""}`} id={`${id}-readable`} aria-live="polite">
        <span aria-hidden="true">{value === null ? "○" : "="}</span> {readableAmount}
      </p>
      {inputError && <p className="field-error" id={`${id}-error`} role="alert">{inputError}</p>}
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
