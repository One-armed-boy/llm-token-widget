# 경쟁 앱 심층 분석

작성일: 2026-06-18

## 결론

이미 동일하거나 매우 가까운 앱이 많습니다. 단순히 "Claude/Codex 사용량을 메뉴바/위젯에서 보기"만으로는 후발입니다.

후속 제품 확장을 넓게 검토한 문서입니다. 2026-06-18 재검토 이후 MVP는 [경량 플랜 재조정과 적대적 검증](11-lightweight-plan-review.md)에 따라 "안전하고 가벼운 다중 계정 위젯"으로 좁혔습니다. 이 문서의 reconciliation, 팀 governance, CLI automation은 MVP 범위가 아니라 후순위 후보입니다.

객관적 경쟁 우위를 만들려면 다음 중 하나 이상을 가져가야 합니다.

1. 공식 Admin API + 로컬 로그를 대조하는 정확성 검증
2. 여러 계정/여러 Mac/모바일까지 이어지는 사용량 의사결정
3. 팀/조직용 예산, 권한, 감사를 포함한 관리 기능
4. 사용량을 보기만 하는 것이 아니라 다음 행동을 제안/자동화하는 라우팅 기능

## 분석 대상

### 공개 소스 분석

- CodexBar: https://github.com/steipete/CodexBar
- Usage4Claude: https://github.com/f-is-h/usage4claude
- ClaudeBar: https://github.com/tddworks/ClaudeBar
- TokenMeter: https://github.com/Priyans-hu/tokenmeter

### 제품 페이지 분석

- SessionWatcher: https://www.sessionwatcher.com/
- UsageScope: https://www.usagescope.com/
- Code Meter: https://apps.apple.com/us/app/code-meter-claude-codex-usage/id6760511858

## 경쟁 기능 매트릭스

| 기능 | CodexBar | Usage4Claude | ClaudeBar | TokenMeter | SessionWatcher | UsageScope | Code Meter | 우리 차별화 여지 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| macOS 메뉴바 | 예 | 예 | 예 | 예 | 예 | 예 | 예 | 없음 |
| Claude/Codex 동시 표시 | 예 | 예 | 예 | 제한 | 예 | 예 | 예 | 없음 |
| WidgetKit 위젯 | 예 | 확인 안 됨 | 확인 안 됨 | 없음 | 예 | 확인 필요 | 예 | 낮음 |
| 다중 provider | 매우 강함 | 중간 | 강함 | 약함 | 중간 | 중간 | 중간 | 낮음 |
| 다중 계정 | 있음 | 있음 | 설계 있음 | 약함 | Pro 기능 | 불명확 | provider switch | 낮음 |
| reset countdown | 있음 | 있음 | 있음 | 있음 | 있음 | 있음 | 있음 | 없음 |
| burn rate / pace | 있음 | 일부 | 있음 | 일부 | 있음 | 있음 | 있음 | 낮음 |
| 알림 | 있음 | 있음 | 있음 | 있음 | 있음 | 불명확 | 있음 | 낮음 |
| 로컬 JSONL 분석 | 있음 | 일부 | 있음 | 강함 | 있음 | 있음 | 있음 | 낮음 |
| 모델/비용 breakdown | 있음 | 일부 | 있음 | 강함 | 있음 | 있음 | 일부 | 낮음 |
| 공식 OpenAI Admin API | 있음 | 약함 | 일부 | 없음 | 불명확 | API fallback | 일부 | 중간 |
| 공식 Anthropic Admin API | 있음으로 표기 | 약함 | Claude API probe | 없음 | 불명확 | 일부 | 일부 | 중간 |
| provider status polling | 있음 | 없음 | 없음 | 없음 | 불명확 | 없음 | 없음 | 중간 |
| CLI/export | 강함 | 약함 | 약함 | 없음 | 없음 | 없음 | 없음 | 중간 |
| iCloud/Mac sync | 일부 | 없음 | 없음 | 없음 | 있음 | 없음 | 없음 | 중간 |
| iOS 위젯 | 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 중간-높음 |
| 팀/조직 예산 관리 | 약함 | 없음 | 약함 | 없음 | 없음 | 없음 | 없음 | 높음 |
| 공식 데이터와 로컬 추정 대조 | 약함 | 없음 | 약함 | 없음 | 없음 | 없음 | 없음 | 높음 |
| 사용량 라우팅 자동화 | 일부 | 없음 | 일부 | 없음 | BestToolNow | 없음 | 없음 | 중간 |

## 공개 소스에서 확인한 구현 방식

### CodexBar

강점:

- 50개 이상 provider를 지원하는 provider descriptor/implementation 구조
- WidgetKit extension이 있고, `WidgetSnapshotStore`가 App Group snapshot을 읽고 씀
- CLI, status polling, cost usage scanner, provider별 settings store가 있음
- OpenAI Admin Usage/Costs API fetcher가 있음
- widget 종류가 usage/history/compact/switcher로 분리됨

코드상 확인:

- `Sources/CodexBarCore/WidgetSnapshot.swift`
- `Sources/CodexBarCore/AppGroupSupport.swift`
- `Sources/CodexBarWidget/*`
- `Sources/CodexBarCore/Providers/OpenAI/OpenAIAPIUsageFetcher.swift`
- `Sources/CodexBarCLI/*`

약점 또는 기회:

- 기능 폭이 매우 넓어 설정/권한/원천 데이터 신뢰도 UX가 복잡해질 수 있음
- 일부 provider는 cookie/local storage/브라우저 데이터 의존성이 큼
- 공식 admin billing과 로컬 JSONL을 "대조해서 차이 원인을 설명"하는 제품 포지션은 약함
- 개인 power-user 도구에 가깝고, 팀 예산/조직 정책/감사 워크플로우는 주력이 아님

### Usage4Claude

강점:

- Claude/Codex 구독 quota UX가 매우 직접적
- built-in WebView login으로 Claude sessionKey와 Codex ChatGPT session token을 잡음
- 다중 Claude 계정/조직과 Codex 계정 관리가 있음
- multi-language, onboarding, diagnostics, Keychain 저장, Sparkle update 등 완성도가 높음

코드상 확인:

- `Views/WebLogin/WebLoginCoordinator.swift`
- `Views/WebLogin/CodexWebLoginCoordinator.swift`
- `Views/WebLogin/CodexTokenRefreshCoordinator.swift`
- `Services/KeychainManager.swift`
- `Helpers/DataRefreshManager.swift`

약점 또는 기회:

- WebView/cookie/session token 중심이라 provider UI/API 변화에 취약
- 공식 Admin API 기반 조직 비용/토큰 리포팅은 주력이 아님
- WidgetKit/iOS 확장은 주된 차별점으로 보이지 않음

### ClaudeBar

강점:

- Domain/Infrastructure/App 레이어가 분명하고 테스트 구조가 좋음
- `QuotaMonitor`를 single source of truth로 두고 provider probe를 프로토콜화
- multi-account protocol, extension script probe, hook server, daily usage analyzer가 있음
- provider 추가 흐름과 테스트가 잘 잡혀 있음

코드상 확인:

- `Sources/Domain/Monitor/QuotaMonitor.swift`
- `Sources/Domain/Provider/UsageSnapshot.swift`
- `Sources/Domain/Provider/UsageQuota.swift`
- `Sources/Domain/Provider/MultiAccountSupport.swift`
- `Sources/Infrastructure/Extension/*`
- `Sources/Infrastructure/Hooks/*`

약점 또는 기회:

- credentials가 일부 UserDefaults/JSON settings 쪽에 남아 있는 구조가 보임
- macOS 15+ 중심이고 WidgetKit/iOS가 핵심은 아님
- 팀/조직용 공식 billing governance는 주력이 아님

### TokenMeter

강점:

- Claude Code 한정으로 depth가 좋음
- Keychain에서 Claude Code OAuth token을 읽어 실제 rate limit API를 호출
- JSONL을 requestId로 dedupe하고 daily/hourly/model/cost breakdown을 제공
- heatmap, daily chart, donut chart 같은 분석 UI가 좋음

코드상 확인:

- `Services/UsageAPIService.swift`
- `Services/NativeUsageParser.swift`
- `Views/UsageHeatmapView.swift`
- `Views/ModelBreakdownView.swift`
- `Views/RateLimitView.swift`

약점 또는 기회:

- Claude Code 중심이라 multi-provider breadth가 약함
- 다른 앱의 Keychain token을 읽는 방식은 UX는 좋지만 정책/권한/신뢰 리스크가 있음
- 공식 조직 Admin API와 다중 계정 관리가 주력은 아님

## 제품 페이지에서 확인한 경쟁 현황

### SessionWatcher

SessionWatcher는 Claude, Codex, Cursor, Copilot, Gemini 등을 자동 감지하고 메뉴바에서 usage/cost/rate limit을 표시합니다. Pro 플랜에는 iCloud sync, multi-account tracking, MacOS widgets, BestToolNow, 90일 history가 포함된다고 설명합니다.

의미:

- "여러 provider + 메뉴바 + widgets + multi-account + 추천"은 이미 경쟁 기능입니다.
- 우리가 같은 기능만 구현하면 늦습니다.

### UsageScope

UsageScope는 macOS menu bar와 Windows system tray를 목표로 하며, local Codex/Claude/Gemini/Grok/Perplexity usage signal, token history, usage heatmap, optional ranking upload를 제공합니다. privacy boundary를 강하게 강조합니다.

의미:

- Windows tray와 ranking/community 비교는 이미 차별화 포인트로 쓰이고 있습니다.
- local-first privacy만으로는 충분하지 않습니다.

### Code Meter

Code Meter는 Claude Code, Codex, Copilot, MiniMax, Z.ai, OpenCode를 지원하고, 5시간/주간 gauge, burn-rate projection, desktop widgets, smart alerts, provider별 history를 제공합니다.

의미:

- burn-rate projection, widgets, smart alerts는 이미 상용 앱의 기본 기능이 되고 있습니다.

## 객관적 경쟁 우위 후보

### 1. Official-vs-local reconciliation

가장 강한 차별화 후보입니다.

기존 앱들은 보통 하나의 best available source를 읽고 표시합니다. 반면 이 기능은 같은 계정의 사용량을 여러 원천에서 비교합니다.

예:

- OpenAI Admin Costs API vs local Codex JSONL/API key usage
- Anthropic Admin Cost Report vs Claude Code JSONL
- provider quota API vs local estimated window

사용자에게 보여줄 결과:

- `공식 청구 데이터: $43.12`
- `로컬 세션 추정: $39.80`
- `차이: $3.32, 원인 후보: 다른 기기/웹 사용/API key 누락/캐시 가격 차이`

왜 객관적 우위인가:

- 단순 표시 앱이 아니라 "정확성 검증" 도구가 됨
- 개인과 팀 모두에게 가치가 있음
- 경쟁 앱의 broad provider 지원과 다른 축

MVP 가능 범위:

- OpenAI 공식 cost + Codex local session cost 대조
- Anthropic 공식 cost + Claude Code local JSONL 대조
- 차이율 threshold와 explanation badge

### 2. Multi-account recommendation with confidence

단순히 BestToolNow처럼 "어느 도구가 여유 있는지"가 아니라, 여러 계정의 신뢰도와 비용 정책을 반영해 추천합니다.

예:

- `지금은 Work Codex 대신 Personal Claude 사용 권장`
- 이유: Work Codex 5h 91%, Anthropic API budget 22%, 공식 데이터 4분 전 갱신
- confidence: high/medium/low

왜 객관적 우위인가:

- 여러 계정 N개의 사용성 목표와 직접 맞음
- 사용자가 실제로 원하는 것은 숫자보다 "지금 뭘 써야 하는지"임
- 공식/로컬/수동 예산의 신뢰도를 같이 반영할 수 있음

MVP 가능 범위:

- 추천 엔진 v1: quota remaining, budget remaining, freshness, authoritative score
- 메뉴바/popup에서 `Best account now` 카드 표시

### 3. Team budget and seat governance

경쟁 앱 대부분은 개인 메뉴바 앱입니다. 팀/조직용이면 객관적 차별화가 큽니다.

기능:

- OpenAI organization/project/API key별 spend
- Anthropic workspace/user별 cost
- user/project별 월간 예산
- "누가 어떤 계정/키에서 비용을 태우는지" 요약
- read-only team dashboard

왜 객관적 우위인가:

- 결제 의사결정자가 돈을 낼 명확한 이유가 있음
- 개인 구독 quota 앱과 경쟁 축이 달라짐
- 공식 Admin API를 활용하는 명분이 큼

MVP 가능 범위:

- 로컬 앱 안에서 team workspace CSV/JSON export
- 후속으로 lightweight web dashboard 또는 공유 snapshot

### 4. Cross-device companion done properly

SessionWatcher는 Mac 간 iCloud sync를 설명하지만, iOS 위젯은 아직 주요 경쟁 기능으로 보이지 않습니다. Usage for Claude 같은 단일 앱은 있으나 multi-provider/admin reconciliation과 결합된 제품은 드뭅니다.

기능:

- Mac이 수집한 sanitized snapshot을 iCloud로 sync
- iPhone/iPad widget에서 계정별 상태 확인
- 모바일에서는 secret 저장/수집을 하지 않음

왜 객관적 우위인가:

- macOS 메뉴바 경쟁을 피하고 사용 장면을 확장함
- "밖에서 오늘 더 돌려도 되는지" 판단 가능
- Apple 생태계 안에서 명확한 제품 경험

MVP 가능 범위:

- macOS app + iOS read-only widget
- iCloud snapshot schema만 공유

### 5. Audit-grade privacy report

경쟁 앱들이 privacy-first를 말하지만, 사용자가 검증할 수 있는 보고서까지 제공하는 경우는 흔하지 않습니다.

기능:

- 앱이 읽은 파일 경로 목록
- 호출한 endpoint 목록
- 저장된 credential ref 목록
- App Group snapshot에 들어간 필드 preview
- 민감 정보 redaction 결과

왜 객관적 우위인가:

- admin key를 넣어야 하는 앱에서 신뢰를 정량화할 수 있음
- 오픈소스 여부와 별개로 사용자가 직접 확인 가능
- 기업/팀 도입에 유리

MVP 가능 범위:

- `Security & Data Access` 화면
- JSON export
- "이번 갱신에서 읽은 source" audit log

### 6. Scriptable decision API

경쟁 앱에 CLI가 있는 경우는 있지만, "지금 어떤 계정/도구를 써야 하는지"를 기계가 읽을 수 있게 내보내는 것은 차별화 여지가 있습니다.

기능:

```bash
llm-usage best --task coding --max-cost 5
llm-usage status --json
llm-usage guard --provider codex --account work --min-remaining 20
```

활용:

- shell prompt
- Raycast
- CI preflight
- Claude/Codex 실행 전 wrapper

왜 객관적 우위인가:

- 단순 관찰에서 워크플로우 자동화로 이동
- power user에게 즉시 가치가 있음
- 다중 계정 제품 목표와 잘 맞음

MVP 가능 범위:

- snapshot JSON + `bestAccount` 계산
- CLI는 후속

## 추천 포지셔닝

후발로 이기려면 다음 포지션이 가장 현실적입니다.

> "AI coding usage meter"가 아니라 "AI usage decision and reconciliation layer"

즉, 보기 좋은 메뉴바 앱이 아니라 다음 질문에 답하는 제품입니다.

- 지금 어떤 계정을 써야 하나?
- 이 숫자는 공식 청구 기준인가, 로컬 추정인가?
- 공식 비용과 로컬 사용량이 왜 다른가?
- 팀/프로젝트/API key별로 어디서 비용이 새고 있나?
- 모바일에서도 지금 상태를 볼 수 있나?

## 로드맵 반영 권장

### 유지

- macOS menu bar
- WidgetKit snapshot
- OpenAI/Anthropic Admin API
- privacy mode
- 다중 계정

### 우선순위 상승

- 공식/로컬 reconciliation
- best account recommendation
- source confidence score
- audit-grade data access report
- scriptable JSON decision API

### 우선순위 하향

- provider 수 확장
- 브라우저 쿠키 자동 수집
- WebView login 기반 개인 구독 quota
- 과도한 chart/personalization

## MVP 재정의

기존 MVP:

- 여러 계정 사용량을 위젯에서 본다.

경쟁 분석 후 MVP:

- OpenAI/Codex와 Anthropic/Claude의 공식 사용량과 로컬 사용량을 함께 보여주고,
- 계정별 신뢰도와 freshness를 반영해,
- 지금 쓸 계정을 추천하며,
- 위젯에는 추천 결과와 위험 계정을 표시한다.

이렇게 바꾸면 경쟁 앱과 겹치더라도 제품의 중심축이 달라집니다.
