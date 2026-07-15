# 검증 계획

## 핵심 가설

- 첫 방문자가 60초 안에 세 단계 입력을 완료할 수 있다.
- 결과에서 목표 날짜의 부족분을 즉시 이해할 수 있다.
- 실행안 3개 중 하나를 선택하고 이번 달 행동 계획을 이해할 수 있다.
- 만 원 입력 뒤 원 단위 환산값을 확인해 단위 오류를 스스로 발견할 수 있다.
- 실행안을 바꾸면 행동 계획이 즉시 바뀌고 체크리스트 완료 상태를 확인할 수 있다.
- 월 적립액 변화가 목표일에 미치는 시간 차이를 이해할 수 있다.
- 저장이 서버가 아닌 현재 브라우저에서만 이뤄짐을 이해한다.

## 비민감 이벤트

`landing_cta_clicked`, `gps_started`, `gps_step_completed`, `gps_calculation_completed`, `goal_action_selected`, `monthly_action_plan_copied`, `condition_compared`, `plan_saved`, `monthly_update_saved`, `backup_exported`, `backup_imported`, `local_data_deleted`를 사용한다. 금액, 소득, 자산, 지출, 메모, 계산 결과는 속성에 넣지 않는다.

## 점검 지표

- 계산 시작률과 완료율
- 단계별 이탈률
- 조건 변경 사용률
- 실행안 선택률과 이번 달 행동 계획 복사율
- 계획 저장률
- 재방문 시 이번 달 업데이트 사용률
- 가이드에서 계산 시작 전환율

임의의 목표값이나 허위 성과 수치는 두지 않는다.
