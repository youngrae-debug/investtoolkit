"use client";

import { type FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency, manwonToWon } from "@/lib/format/currency";
import { formatArrivalDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";
import {
  calculatePolicyBenefitImpact,
  calculateHouseholdIncomeThresholdManwon,
  matchPolicyPrograms,
  type IncomeKind,
  type PolicyMatchStatus,
  type PolicyProgramId,
  type WelfareStatus,
} from "@/lib/policies/policy-benefits";
import { addMonths } from "@/lib/simulation/engine";
import type { SimulationInput } from "@/lib/simulation/types";
import { MoneyInput } from "./money-input";

interface PolicyBenefitFinderProps {
  input?: SimulationInput;
  targetMonths?: number;
  autoOpen?: boolean;
  standalone?: boolean;
}

const MAX_ANNUAL_INCOME_MANWON = 100_000;
const MAX_POLICY_SUPPORT_MANWON = 1_000;

function matchStatusCopy(status: PolicyMatchStatus): string {
  if (status === "possible") return "대상 가능성 있음";
  if (status === "check") return "추가 확인 필요";
  return "조건상 맞지 않을 수 있음";
}

export function PolicyBenefitFinder({ input, targetMonths, autoOpen = false, standalone = false }: PolicyBenefitFinderProps) {
  const [finderOpen, setFinderOpen] = useState(autoOpen);
  const [age, setAge] = useState("");
  const [incomeKind, setIncomeKind] = useState<IncomeKind | "">("");
  const [annualIncomeManwon, setAnnualIncomeManwon] = useState<number | null>(null);
  const [householdSize, setHouseholdSize] = useState(1);
  const [householdAnnualIncomeManwon, setHouseholdAnnualIncomeManwon] = useState<number | null>(null);
  const [marriedCoupleOnly, setMarriedCoupleOnly] = useState(false);
  const [welfareStatus, setWelfareStatus] = useState<WelfareStatus>("unknown");
  const [screened, setScreened] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<PolicyProgramId | null>(null);
  const [supportManwon, setSupportManwon] = useState<number | null>(null);
  const [supportMonths, setSupportMonths] = useState(36);
  const [officiallyConfirmed, setOfficiallyConfirmed] = useState(false);
  const impactRef = useRef<HTMLDivElement>(null);

  const parsedAge = Number(age);
  const householdPercentage = marriedCoupleOnly && householdSize === 2 ? 250 : 200;
  const householdThresholdManwon = calculateHouseholdIncomeThresholdManwon(householdSize, householdPercentage);
  const householdIncomeIsValid = householdAnnualIncomeManwon === null
    || (householdAnnualIncomeManwon <= MAX_ANNUAL_INCOME_MANWON
      && (annualIncomeManwon === null || householdAnnualIncomeManwon >= annualIncomeManwon));
  const canScreen = Number.isInteger(parsedAge)
    && parsedAge >= 15
    && parsedAge <= 100
    && incomeKind !== ""
    && householdIncomeIsValid
    && (incomeKind === "none"
      || (annualIncomeManwon !== null && annualIncomeManwon <= MAX_ANNUAL_INCOME_MANWON));
  const matches = canScreen
    ? matchPolicyPrograms({
        age: parsedAge,
        incomeKind,
        annualIncomeManwon: incomeKind === "none" ? null : annualIncomeManwon,
        householdSize,
        householdAnnualIncomeManwon,
        marriedCoupleOnly: marriedCoupleOnly && householdSize === 2,
        welfareStatus,
      })
    : [];
  const selectedPolicy = matches.find((program) => program.id === selectedPolicyId) ?? null;
  const impact = input
    && targetMonths !== undefined
    && selectedPolicy
    && officiallyConfirmed
    && supportManwon !== null
    && supportManwon > 0
    && supportManwon <= MAX_POLICY_SUPPORT_MANWON
    && supportMonths >= 1
    && supportMonths <= 120
      ? calculatePolicyBenefitImpact({
          input,
          targetMonths,
          monthlySupport: manwonToWon(supportManwon),
          supportMonths,
        })
      : null;
  const supportPrincipal = supportManwon === null || targetMonths === undefined
    ? 0
    : manwonToWon(supportManwon) * Math.min(targetMonths, supportMonths);

  function resetConfirmation() {
    setOfficiallyConfirmed(false);
  }

  function handleScreen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canScreen) return;
    setScreened(true);
    setSelectedPolicyId(null);
    resetConfirmation();
  }

  function selectPolicy(id: PolicyProgramId, defaultSupportMonths: number) {
    setSelectedPolicyId(id);
    setSupportManwon(null);
    setSupportMonths(defaultSupportMonths);
    resetConfirmation();
    requestAnimationFrame(() => impactRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  const potentialCount = matches.filter((program) => program.matchStatus !== "unlikely").length;
  const householdQuickAmounts = [0.6, 0.8, 1].map((ratio) => {
    const value = Math.max(100, Math.round((householdThresholdManwon * ratio) / 100) * 100);
    return { label: formatCurrency(manwonToWon(value)), value };
  });
  const changedArrivalDate = !input || impact?.changedMonthsToGoal === null || impact?.changedMonthsToGoal === undefined
    ? null
    : addMonths(input.startDate ?? new Date(), impact.changedMonthsToGoal);

  return (
    <section id="policy-benefits" className={`result-section policy-benefit-section ${standalone ? "policy-benefit-section--standalone" : ""}`} aria-labelledby="policy-benefit-title">
      <div className="policy-benefit-intro">
        <div>
          <span className="section-kicker">{standalone ? "정책 혜택 간이 확인" : "놓치기 쉬운 추가 기회"}</span>
          <h2 id="policy-benefit-title">{standalone ? "내 조건에 맞는 정책을 찾아보세요" : "정책 혜택도 함께 찾아볼까요?"}</h2>
          <p>{standalone ? "나이와 소득, 가구 조건으로 정책형 적금과 지원 통장의 대상 가능성을 확인합니다." : "내 조건에 맞을 가능성이 있는 정책형 적금과 지원 통장을 찾고, 확인한 지원액이 목표에 미치는 영향까지 계산해요."}</p>
        </div>
        {!finderOpen && <button type="button" className="button button--primary" onClick={() => setFinderOpen(true)}>내 혜택 가능성 확인</button>}
      </div>

      {finderOpen && (
        <div className="policy-finder-body">
          <form className="policy-profile-form" onSubmit={handleScreen}>
            <fieldset>
              <legend>간단한 조건 확인</legend>
              <p>정확한 가입 판정이 아닌 1차 확인입니다. 모르는 항목은 ‘모름’으로 두어도 돼요.</p>
              <div className="policy-form-grid">
                <div className="policy-field">
                  <label htmlFor="policy-age">현재 만 나이</label>
                  <small id="policy-age-hint">병역이행기간은 공식 심사에서 별도로 확인해요.</small>
                  <span className="policy-number-input"><input id="policy-age" aria-describedby="policy-age-hint" inputMode="numeric" min="15" max="100" value={age} onChange={(event) => { setAge(event.target.value.replace(/[^0-9]/g, "").slice(0, 3)); setScreened(false); }} placeholder="예: 29" /><b aria-hidden="true">세</b></span>
                </div>
                <div className="policy-field">
                  <label htmlFor="policy-income-kind">지난해 소득 형태</label>
                  <small id="policy-income-kind-hint">근로소득은 총급여, 사업소득은 연매출 기준입니다.</small>
                  <select id="policy-income-kind" aria-describedby="policy-income-kind-hint" value={incomeKind} onChange={(event) => { setIncomeKind(event.target.value as IncomeKind | ""); setAnnualIncomeManwon(null); setScreened(false); }}>
                    <option value="">선택해 주세요</option>
                    <option value="salary">근로소득</option>
                    <option value="business">사업소득·매출</option>
                    <option value="none">소득 없음</option>
                  </select>
                </div>
                {incomeKind && incomeKind !== "none" && (
                  <MoneyInput
                    id="policy-annual-income"
                    label={incomeKind === "salary" ? "지난해 총급여" : "지난해 연매출"}
                    hint="세전 금액을 만 원 단위로 입력하세요."
                    value={annualIncomeManwon}
                    onChange={(value) => { setAnnualIncomeManwon(value); setScreened(false); }}
                    maxValue={MAX_ANNUAL_INCOME_MANWON}
                    quickAmounts={incomeKind === "salary"
                      ? [{ label: "3,600만 원", value: 3_600 }, { label: "5,000만 원", value: 5_000 }, { label: "7,500만 원", value: 7_500 }]
                      : [{ label: "5,000만 원", value: 5_000 }, { label: "1억 원", value: 10_000 }, { label: "3억 원", value: 30_000 }]}
                  />
                )}
                <div className="policy-field">
                  <label htmlFor="policy-household-size">함께 심사되는 가구원 수</label>
                  <small id="policy-household-size-hint">공식 심사에서는 주민등록표와 가족관계 기준으로 가구원을 확정해요.</small>
                  <select id="policy-household-size" aria-describedby="policy-household-size-hint" value={householdSize} onChange={(event) => { const size = Number(event.target.value); setHouseholdSize(size); if (size !== 2) setMarriedCoupleOnly(false); setScreened(false); }}>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((size) => <option value={size} key={size}>{size}명</option>)}
                  </select>
                </div>
                {householdSize === 2 && (
                  <label className="policy-couple-check">
                    <input type="checkbox" checked={marriedCoupleOnly} onChange={(event) => { setMarriedCoupleOnly(event.target.checked); setScreened(false); }} />
                    <span><strong>신청자와 배우자로만 구성된 2인 가구예요</strong><small>청년미래적금 일반형은 최신 기준상 250% 특례를 적용해 간이 계산합니다.</small></span>
                  </label>
                )}
                <div className="policy-household-income-field">
                  <MoneyInput
                    id="policy-household-annual-income"
                    label="가구원의 지난해 세전 소득 합계"
                    hint={`2026년 ${householdSize}인 가구 ${householdPercentage}% 간이 기준은 연 ${formatCurrency(manwonToWon(householdThresholdManwon))} 이하입니다. 모르면 비워두세요.`}
                    value={householdAnnualIncomeManwon}
                    onChange={(value) => { setHouseholdAnnualIncomeManwon(value); setScreened(false); }}
                    maxValue={MAX_ANNUAL_INCOME_MANWON}
                    quickAmounts={householdQuickAmounts}
                  />
                  {householdAnnualIncomeManwon !== null && annualIncomeManwon !== null && householdAnnualIncomeManwon < annualIncomeManwon && <p className="field-error" role="alert">가구소득 합계는 본인의 개인소득보다 작을 수 없어요.</p>}
                </div>
                <div className="policy-field">
                  <label htmlFor="policy-welfare-status">가구의 복지 자격</label>
                  <small id="policy-welfare-status-hint">가구 기준이며 본인 개인 자격과 다를 수 있어요.</small>
                  <select id="policy-welfare-status" aria-describedby="policy-welfare-status-hint" value={welfareStatus} onChange={(event) => { setWelfareStatus(event.target.value as WelfareStatus); setScreened(false); }}>
                    <option value="unknown">모름</option>
                    <option value="livelihood-medical">생계·의료급여 수급</option>
                    <option value="housing-education-near-poverty">주거·교육급여 또는 차상위</option>
                    <option value="other">해당 없음</option>
                  </select>
                </div>
              </div>
              <div className="policy-form-actions">
                <button type="submit" className="button button--primary" disabled={!canScreen}>{screened ? "조건 다시 확인" : "가능한 정책 확인"}</button>
                <button type="button" className="button button--text" onClick={() => setFinderOpen(false)}>접기</button>
              </div>
              <p className="policy-privacy"><span aria-hidden="true">●</span> 입력한 조건은 이 화면에서만 계산하며 서버로 보내지 않아요.</p>
            </fieldset>
          </form>

          {screened && (
            <div className="policy-match-results" aria-live="polite">
              <div className="policy-match-summary">
                <span>공식 정책 3개 확인</span>
                <strong>{potentialCount > 0 ? `가능성을 확인할 정책 ${potentialCount}개` : "현재 입력 조건에서는 추가 확인이 필요해요"}</strong>
                <p>‘대상 가능성 있음’은 가입 확정이 아닙니다. 모집 여부와 최종 자격은 공식 페이지에서 확인해 주세요.</p>
              </div>
              <div className="policy-card-grid">
                {matches.map((program) => (
                  <article className={`policy-card policy-card--${program.matchStatus}`} key={program.id}>
                    <div className="policy-card__top"><span>{matchStatusCopy(program.matchStatus)}</span><small>확인 {program.verifiedAt}</small></div>
                    <h3>{program.name}</h3>
                    <p>{program.summary}</p>
                    <dl>
                      <div><dt>확인 결과</dt><dd>{program.matchReason}</dd></div>
                      <div><dt>지원 내용</dt><dd>{program.benefit}</dd></div>
                      <div><dt>모집 상태</dt><dd>{program.availability}</dd></div>
                    </dl>
                    <div className="policy-card__actions">
                      <a href={program.officialUrl} target="_blank" rel="noreferrer">공식 안내 확인 <span aria-hidden="true">↗</span></a>
                      {input && targetMonths !== undefined && program.matchStatus !== "unlikely" && <button type="button" onClick={() => selectPolicy(program.id, program.defaultSupportMonths)}>목표 영향 계산</button>}
                    </div>
                  </article>
                ))}
              </div>
              {standalone && (
                <div className="policy-standalone-cta">
                  <div><span>내 목표에 연결하기</span><h3>이 혜택이 부족분을 얼마나 줄이는지 계산할까요?</h3><p>Money GPS 계산을 마치면 공식 안내에서 확인한 지원액을 목표 계획에 적용할 수 있어요.</p></div>
                  <Link className="button button--primary" href="/money-gps">Money GPS 시작하기</Link>
                </div>
              )}
            </div>
          )}

          {screened && input && targetMonths !== undefined && selectedPolicy && (
            <div className="policy-impact-panel" ref={impactRef}>
              <div className="policy-impact-heading">
                <span>공식 안내 확인 후</span>
                <h3>{selectedPolicy.name} 지원 효과 계산</h3>
                <p>본인 납입액은 이미 ‘매달 모을 돈’에 포함된 것으로 보고, 그 납입액을 기준으로 추가되는 지원금만 더해 계산합니다.</p>
              </div>
              <div className="policy-funding-formula" aria-label="정책 통장 월 적립 구조">
                <span>본인 납입액<small>매달 모을 돈에 포함</small></span>
                <b aria-hidden="true">+</b>
                <span>정부·지자체 지원액<small>아래에 입력</small></span>
                <b aria-hidden="true">=</b>
                <strong>정책 통장 월 적립액</strong>
              </div>
              <div className="policy-impact-inputs">
                <MoneyInput
                  id="policy-support-amount"
                  label="확인한 월 지원액"
                  hint="본인 납입액을 기준으로 정부·지자체가 추가 적립하는 금액만 입력하세요."
                  value={supportManwon}
                  onChange={(value) => { setSupportManwon(value); resetConfirmation(); }}
                  maxValue={MAX_POLICY_SUPPORT_MANWON}
                  quickAmounts={[{ label: "3만 원", value: 3 }, { label: "10만 원", value: 10 }, { label: "30만 원", value: 30 }]}
                />
                <div className="policy-field">
                  <label htmlFor="policy-support-months">지원받는 기간</label>
                  <small id="policy-support-months-hint">공식 안내에 적힌 지원 개월 수를 입력하세요.</small>
                  <span className="policy-number-input"><input id="policy-support-months" aria-describedby="policy-support-months-hint" inputMode="numeric" min="1" max="120" value={supportMonths} onChange={(event) => { setSupportMonths(Math.min(120, Math.max(0, Number(event.target.value.replace(/[^0-9]/g, ""))))); resetConfirmation(); }} /><b aria-hidden="true">개월</b></span>
                  <span className="policy-month-buttons" aria-label="지원 기간 빠른 선택">
                    {[12, 36, 60].map((months) => <button type="button" key={months} aria-pressed={supportMonths === months} onClick={() => { setSupportMonths(months); resetConfirmation(); }}>{months}개월</button>)}
                  </span>
                </div>
              </div>
              <label className="policy-confirmation">
                <input type="checkbox" checked={officiallyConfirmed} disabled={supportManwon === null || supportManwon <= 0 || supportManwon > MAX_POLICY_SUPPORT_MANWON || supportMonths < 1} onChange={(event) => setOfficiallyConfirmed(event.target.checked)} />
                <span>공식 안내에서 지원액과 지원 기간을 확인했습니다.</span>
              </label>
              {impact && (
                <div className="policy-impact-result" aria-live="polite">
                  <div className="policy-impact-result__lead"><span>정책 지원 반영 결과</span><strong>{impact.shortageAtTarget === 0 ? "목표 날짜의 부족분을 채울 수 있어요" : `부족분이 ${formatCurrency(impact.shortageReduction)} 줄어요`}</strong></div>
                  <div className="policy-impact-grid">
                    <div><small>목표일까지 지원금 원금</small><strong>{formatCurrency(supportPrincipal)}</strong></div>
                    <div><small>목표일 예상 효과</small><strong>+{formatCurrency(impact.benefitAtTarget)}</strong></div>
                    <div><small>지원 반영 후 부족분</small><strong>{impact.shortageAtTarget === 0 ? "부족분 없음" : formatCurrency(impact.shortageAtTarget)}</strong></div>
                    <div><small>예상 도착 변화</small><strong>{impact.becameReachable ? "100년 안에 도달 가능" : impact.monthsEarlier && impact.monthsEarlier > 0 ? `${formatDuration(impact.monthsEarlier)} 단축` : changedArrivalDate ? formatArrivalDate(changedArrivalDate) : "도착 시점 확인 어려움"}</strong></div>
                  </div>
                  <p>본인 납입액은 기존 ‘매달 모을 돈’에 이미 포함되어 중복으로 더하지 않습니다. 현재 선택한 연 {input.annualRate}% 계산 가정을 동일하게 적용한 참고값이며, 실제 지급 시점과 금융기관별 조건은 공식 안내를 따라야 합니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
