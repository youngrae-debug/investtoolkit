import { dateToMonthValue, futureMonthValue } from "@/lib/format/month-value";

interface GoalDateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GoalDateInput({ value, onChange }: GoalDateInputProps) {
  const now = new Date();
  const minimum = dateToMonthValue(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  return (
    <div className="goal-date-group">
      <label htmlFor="goal-date">목표 날짜</label>
      <p id="goal-date-hint">그 돈이 필요한 연도와 월을 선택하세요.</p>
      <input
        id="goal-date"
        type="month"
        min={minimum}
        value={value}
        aria-describedby="goal-date-hint"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="quick-dates" aria-label="목표 날짜 빠른 선택">
        {[3, 5, 10].map((years) => (
          <button
            type="button"
            key={years}
            aria-pressed={value === futureMonthValue(years)}
            onClick={() => onChange(futureMonthValue(years))}
          >
            {years}년 후
          </button>
        ))}
      </div>
    </div>
  );
}
