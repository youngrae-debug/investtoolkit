# INVETK Money GPS

목표와 현재 계획을 입력하면 예상 목표 충족률과 부족분을 진단하고, 월 적립 확대·목돈 추가·기간 조정의 세 가지 해결책과 이번 달 실행 계획을 제공하는 돈 목표 해결 도구입니다. 첫 결과는 수익률 0% 원금 기준이며, 이후에만 수익률 가정과 상세 기능을 제공합니다.

## 제품 차별점

- 여러 금융 계산기의 모음이 아닌 하나의 돈 목표 해결 경험
- 목표 금액과 날짜를 하나의 목적지 질문으로 묶은 3단계 입력
- 목표 날짜의 예상 충족률과 부족분, 세 가지 해결책을 우선 표시
- 선택한 방법을 이번 달 자동이체·추가금·월말 확인으로 변환
- 금융 입력을 서버나 URL, 분석 이벤트로 전송하지 않음
- 회원가입 없이 명시적으로 저장한 계획만 현재 브라우저에 보관
- 특정 금융상품이나 종목을 추천하지 않음

## 기술

- Next.js App Router 호환 Vinext
- React 19, TypeScript strict mode, Tailwind CSS 4
- Zod 기반 로컬 데이터 스키마 검증
- Vitest 단위 테스트, Playwright 모바일 E2E
- Sites/Cloudflare Worker 호환 ESM 출력

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

## 검사와 빌드

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run verify:ads
npm run build
npm run start
```

Playwright 브라우저가 없는 환경에서는 최초 1회 `npx playwright install chromium`을 실행합니다.
`npm run verify:ads`는 광고 환경변수가 없는 상태와 테스트 게시자·슬롯 ID가 있는 상태를 연속 실행하며 실제 Google 광고 요청은 가로챕니다.

## 주요 흐름

1. 목표 금액과 목표 날짜 입력
2. 지금까지 모은 돈 입력
3. 매달 모을 돈 입력 또는 ‘월급과 지출로 계산하기’ 선택
4. 수익률 0% 원금 기준 부족분 확인
5. 월 적립 확대·목돈 추가·기간 조정의 해결책 3개 비교
6. 선택한 방법의 이번 달 행동 계획 확인
7. 선택적으로 수익률 가정과 조건 변경 비교
8. 계획을 현재 브라우저에 저장
9. 재방문 시 실제로 모은 금액을 기록하고 계획 대비 차이와 목표 변화를 확인

## 계산 엔진

월별 계산은 [`lib/simulation/engine.ts`](./lib/simulation/engine.ts), 목표 날짜 해결안은 [`lib/simulation/goal-solver.ts`](./lib/simulation/goal-solver.ts)에 UI와 분리된 순수 함수로 구현되어 있습니다. 두 계산 경로는 [`lib/simulation/growth.ts`](./lib/simulation/growth.ts)의 월 수익률과 월말 잔액 규칙을 공통으로 사용합니다.

- 최대 기간: 1,200개월
- 연 수익률 범위: -20%~30%
- 월 수익률: `(1 + annualRate / 100)^(1/12) - 1`
- 월별 순서: 기초 자산 수익률 적용 → 월 순유입액 → 일회성 자금
- 첫 정기 적립: 다음 달 말
- 음수 잔액: 0원으로 보정하지 않고 자금 부족 시점과 금액 반환

세금, 수수료, 물가, 자산별 수익률 차이는 기본 계산에서 제외합니다. 자세한 기준은 `/methodology`에 공개합니다.

## 브라우저 저장과 개인정보

기본 계산은 저장하지 않습니다. 사용자가 ‘계획 저장’을 누른 경우에만 버전 6 스키마의 목표 날짜, 선택한 해결책, 월별 계획·실제 저축액과 선택한 변화 이유를 localStorage에 보관합니다. 이전 버전 데이터는 자동 이전합니다. 사용자는 데이터 백업, 백업 불러오기, 전체 삭제를 직접 실행할 수 있으며 저장 데이터가 없는 브라우저에서도 백업을 복원할 수 있습니다.

분석 이벤트에는 단계 번호, 기능 사용 여부, 결과 상태 같은 비금융 속성만 허용합니다. 월급, 자산, 목표 금액, 지출, 월 적립액, 메모와 전체 결과는 포함하지 않습니다.

AdSense는 수동 반응형 광고 단위 한 개를 가이드 상세 글의 두 번째 본문 뒤에만 배치합니다. 광고 선택에 동의한 경우에만 스크립트를 불러오고, 광고 요청은 항상 비개인화 방식으로 설정합니다. 계산기와 정책 혜택 페이지에는 광고 컴포넌트가 없습니다.

## 환경 변수

- `NEXT_PUBLIC_REPORT_CTA_URL`: 설정된 경우에만 외부 보고서 CTA를 연결할 수 있음. 현재 MVP UI에서는 사용하지 않음.
- `NEXT_PUBLIC_CONTACT_EMAIL`: 설정된 경우에만 문의 주소를 표시할 수 있음. 현재 MVP UI에서는 사용하지 않음.
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID`: AdSense 게시자 ID. `ca-pub-`와 16자리 숫자 형식일 때만 사용.
- `NEXT_PUBLIC_ADSENSE_GUIDE_SLOT_ID`: 가이드 상세용 반응형 디스플레이 광고 슬롯 ID. 10자리 숫자 형식일 때만 사용.

게시자 ID가 유효하면 사이트 확인 메타 태그와 `/ads.txt`가 활성화됩니다. 게시자 ID와 슬롯 ID가 모두 유효해야 가이드 상세의 광고 선택 UI와 광고 단위가 활성화됩니다. 둘 중 하나라도 빠지면 광고 스크립트는 렌더링하지 않습니다. 운영 전 확인 항목은 [`docs/ADSENSE_ROLLOUT.md`](./docs/ADSENSE_ROLLOUT.md)에 정리했습니다.

## 배포와 도메인

현재 프로젝트는 `.openai/hosting.json`과 Cloudflare Worker 엔트리를 사용해 Sites 배포에 맞춰져 있습니다. 배포 후 `invetk.com` 연결 시 다음을 확인합니다.

- DNS와 HTTPS 인증서
- `https://invetk.com/sitemap.xml`과 `/robots.txt`
- canonical, Open Graph 이미지, 공유 미리보기
- 모든 법적 문서와 가이드 경로의 200 응답
- 모바일 첫 계산과 브라우저 저장

Vercel에 직접 배포하려면 Vinext/Cloudflare 어댑터 대신 Next.js 네이티브 빌드 구성을 별도 검증해야 합니다. 현재 검증된 프로덕션 산출물은 Sites/Cloudflare Worker 대상입니다.

## 문서

- [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md)
- [`docs/PRODUCT_DECISIONS.md`](./docs/PRODUCT_DECISIONS.md)
- [`docs/VALIDATION_PLAN.md`](./docs/VALIDATION_PLAN.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)

## 현재 MVP의 한계

- 한 번에 하나의 목표 계획만 저장
- 서버 계정과 기기 간 동기화 없음
- 세금·수수료·물가 자동 반영 없음
- 자산군별 수익률과 위험 분리 없음
- PDF 보고서, 대출 상환 계산, 배당·연금 계산 없음
