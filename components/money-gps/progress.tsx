interface ProgressProps {
  current: number;
}

export function Progress({ current }: ProgressProps) {
  const labels = ["목표", "현재", "월 적립"];
  return (
    <div className="progress-wrap" aria-label={`계산 진행 ${current}/3`}>
      <div className="progress-copy"><span>내 해결안 만들기</span><strong>{current}/3</strong></div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(current / 3) * 100}%` }} />
      </div>
      <div className="progress-steps" aria-hidden="true">
        {labels.map((label, index) => <span className={index + 1 <= current ? "is-active" : ""} key={label}>{label}</span>)}
      </div>
    </div>
  );
}
