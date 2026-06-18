# 데이터 소스와 API 경계

작성일: 2026-06-18

이 문서는 공식 문서 기준으로 확인한 수집 가능성과 제약을 정리합니다. API 제공 범위는 바뀔 수 있으므로 구현 전 다시 확인해야 합니다.

## 요약

| 대상 | 권장 수집 방식 | 신선도 | MVP 지원 |
| --- | --- | --- | --- |
| OpenAI API 사용량 | OpenAI Admin Usage/Costs API | 분/시간/일 단위 가능 | 예 |
| Codex API key 로그인 사용량 | OpenAI API 사용량으로 집계 | OpenAI Usage API 범위 | 예 |
| Codex ChatGPT 로그인 개인 Plus/Pro | 공개 API 확인 필요, 앱 내부 상태 또는 수동 한도 | 제한적 | 제한 |
| Codex Business/Enterprise | ChatGPT workspace analytics/compliance 계열 | 문서상 지연 가능 | 후속 |
| Anthropic Claude API | Anthropic Admin Usage and Cost API | 집계 리포트 | 예 |
| Claude Code API 고객 | Claude Console/Claude Code Analytics API | 대시보드/API 범위 | 후속 |
| Claude Code Pro/Max 개인 | `/usage` 로컬 표시 또는 plan usage bar, 공식 API 불명확 | 로컬/제한적 | 제외 |

## OpenAI / Codex

### OpenAI API 사용량

OpenAI Admin Usage API는 organization usage bucket을 반환하며, completions usage 결과에 input/output/cached/audio token, request count, model, project, user, API key group 정보를 포함할 수 있습니다.

관련 공식 문서:

- OpenAI Usage API reference: https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/completions
- OpenAI Costs API reference: https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs

MVP에서는 OpenAI API key 기반 사용량을 다음 방식으로 지원합니다.

- Admin API key 등록
- organization costs 조회
- completions usage 조회
- Usage API는 `project_id`, `api_key_id`, `model`, `user_id` 같은 usage breakdown을 capability로 표현
- Costs API는 문서상 `project_id`, `line_item`, `api_key_id` 중심으로 비용 breakdown을 표현
- cost와 token을 분리 저장하고, 같은 차원으로 묶을 수 없는 값은 UI에서 별도 섹션으로 표시

### Codex 인증 방식 차이

Codex는 ChatGPT 로그인과 API key 로그인을 모두 지원합니다. API key 로그인은 OpenAI Platform 계정의 표준 API 과금으로 처리됩니다. ChatGPT 로그인은 ChatGPT workspace 권한과 플랜 정책을 따릅니다.

관련 공식 문서:

- Codex authentication manual: https://developers.openai.com/codex/auth
- Codex pricing manual: https://developers.openai.com/codex/pricing

MVP 판단:

- Codex를 API key로 사용하는 경우: OpenAI Usage/Costs API로 지원
- Codex를 ChatGPT 개인 구독으로 사용하는 경우: 정확한 잔여 한도 API는 MVP에서 전제하지 않음
- Codex Business/Enterprise의 workspace 분석 API는 후속 milestone에서 별도 adapter로 추가

### Codex 로컬 신호

Codex CLI/App 문서에는 `/status`가 thread ID, context usage, rate limit을 표시한다고 되어 있습니다. 또한 Codex structured log event에는 token count가 포함될 수 있습니다. 다만 이것은 전체 계정의 권위 있는 청구/한도 API로 보지 않습니다.

MVP에서는 로컬 로그 파싱을 사용하지 않습니다. 사용자가 명시적으로 선택하는 로컬 세션 참고값은 MVP 이후 opt-in 기능으로만 검토합니다.

## Anthropic / Claude / Claude Code

### Anthropic Admin API

Anthropic Admin API는 organization info, usage and cost reports, Claude Code analytics, rate limits 등을 제공합니다.

관련 공식 문서:

- Anthropic Admin API: https://platform.claude.com/docs/en/manage-claude/admin-api
- Anthropic Usage Report API: https://platform.claude.com/docs/en/api/admin/usage_report
- Anthropic Messages Usage Report: https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_messages
- Anthropic Cost Report API: https://platform.claude.com/docs/en/api/admin/cost_report
- Anthropic Cost Report retrieve: https://platform.claude.com/docs/en/api/admin/cost_report/retrieve

MVP에서는 Anthropic Admin API key를 등록해 계정 단위의 최소 사용량/비용 요약을 가져오는 adapter를 둡니다. 사용자별/워크스페이스별 상세 breakdown은 후순위입니다.

### Claude Code Analytics

Claude Code Analytics는 plan에 따라 다른 대시보드를 제공합니다. Team/Enterprise는 claude.ai analytics, API 고객은 Claude Console dashboard를 사용합니다. 문서상 API 고객 dashboard는 usage/spend metrics와 team insights를 보여주며, per-user spend this month와 accepted lines 같은 값을 포함합니다.

관련 공식 문서:

- Claude Code Analytics: https://code.claude.com/docs/en/analytics
- Claude Code Usage Report API: https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_claude_code

MVP에서는 Claude Code Analytics를 직접 구현하지 않습니다. API 고객/관리자 권한이 있는 계정의 상세 analytics는 후순위입니다.

### Claude Code OpenTelemetry

Claude Code는 OpenTelemetry로 usage, cost, tool activity metrics/events를 내보낼 수 있습니다. 이는 조직 또는 로컬 환경에서 근실시간 수집이 필요할 때 가장 좋은 확장 지점입니다.

관련 공식 문서:

- Claude Code Monitoring: https://code.claude.com/docs/en/monitoring-usage

MVP에서는 OTel collector를 내장하지 않습니다. 로컬 OTLP receiver 또는 Prometheus scrape adapter는 후순위 opt-in 기능입니다.

### Claude Code 개인 플랜

Claude Code `/usage`는 세션 사용량, plan usage bar, 최근 24시간/7일 breakdown 등을 보여줄 수 있지만, 문서상 로컬 세션 history 기반 값은 다른 기기나 claude.ai 사용을 포함하지 않는 것으로 설명됩니다. 비용 수치도 실제 청구와 다를 수 있습니다.

관련 공식 문서:

- Claude Code Costs: https://code.claude.com/docs/en/costs

MVP에서는 개인 Pro/Max의 정확한 전체 잔여량을 자동 API로 보장하지 않고, 자동 수집 대상에서도 제외합니다. 대신 다음 중 하나로 표시합니다.

- 미지원/권한 필요
- 사용자가 입력한 수동 월간 예산 대비 API 사용량
- 후순위: 명시 opt-in 로컬 세션 참고값

## Capability 모델

각 account는 adapter가 지원하는 metric을 명시합니다.

```json
{
  "supports_authoritative_cost": true,
  "supports_authoritative_tokens": true,
  "supports_remaining_quota": false,
  "supports_user_breakdown": true,
  "supports_near_realtime": false,
  "max_lookback_days": 90,
  "typical_lag_minutes": 60
}
```

UI는 capability가 없는 값을 빈칸이나 0으로 표시하지 않고 `지원 안 됨`, `권한 필요`, `지연됨`으로 표시합니다.
