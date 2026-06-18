# 유사 사례 리서치

작성일: 2026-06-18

## 조사 대상

- ccusage: https://github.com/ccusage/ccusage
- UsageScope: https://apps.apple.com/us/app/usagescope-ai-usage-monitor/id6759642037
- SessionWatcher: https://www.sessionwatcher.com/
- TokenMeter: https://github.com/Priyans-hu/tokenmeter
- ClaudeMeter: https://eddmann.com/ClaudeMeter/
- CodexBar: https://github.com/steipete/codexbar
- Usage for Claude iOS companion: https://apps.apple.com/us/app/usage-for-claude/id6755173244
- Langfuse: https://langfuse.com/
- Stats: https://github.com/exelban/stats
- iStat Menus: https://bjango.com/mac/istatmenus/

## 가져올 만한 아이디어

### 1. 자동 감지 우선, 수동 연결은 보조

SessionWatcher, UsageScope, CodexBar는 사용자가 쓰는 CLI/provider를 자동 감지하는 방향을 강조합니다. 우리도 첫 실행에서 `~/.claude`, `~/.codex`, provider CLI 설치 여부를 읽어 "연결 가능 후보"를 보여주는 편이 좋습니다.

단, 자동 감지는 계정 연결을 대신하지 않습니다. 민감한 경로나 Keychain 접근은 명시 opt-in으로 분리합니다.

MVP 반영:

- 첫 화면에 `감지된 도구` 섹션 추가
- Claude Code, Codex CLI 설치 여부만 먼저 표시
- token/key 접근은 사용자가 선택한 뒤 설명하고 요청

### 2. Reset countdown이 사용량 숫자만큼 중요

SessionWatcher, ClaudeMeter, CodexBar 모두 session/weekly/monthly reset 시간을 핵심 정보로 둡니다. 사용자는 "얼마나 썼나"보다 "언제 다시 쓸 수 있나"를 자주 궁금해합니다.

MVP 반영:

- `UsageMetrics.resetAt`을 primary 모델에 유지
- 위젯의 secondary value 후보에 `resets in 2h 14m` 추가
- resetAt이 없는 source는 `reset unknown`이 아니라 capability로 숨김 처리

### 3. Menu bar에는 최악 상태 또는 선택 provider만 표시

CodexBar는 provider별 status item 또는 merge icons mode를 제공합니다. 여러 계정을 모두 메뉴바에 늘어놓으면 공간을 너무 많이 씁니다.

MVP 반영:

- 기본값: 전체 상태 1개 아이콘
- 옵션: provider별 아이콘 표시
- 옵션: 가장 위험한 계정 자동 선택
- popover에서 전체 계정 상세 표시

### 4. 숫자보다 상태 판단을 먼저 보여준다

ClaudeMeter는 녹색/노란색/빨간색 gauge를 강조합니다. iStat Menus/Stats 같은 시스템 모니터도 메뉴바에서는 사용자가 즉시 판단할 수 있는 작은 indicator가 핵심입니다.

MVP 반영:

- 색상 상태는 `ok/warning/critical/unknown` 4단계
- critical reason을 한 줄로 표시
- 상세 숫자는 popover와 large widget에만 확장

### 5. Low-quota alert는 필수 기능에 가깝다

UsageScope, SessionWatcher, ClaudeMeter, TokenMeter는 threshold notification을 주요 기능으로 둡니다.

MVP 반영:

- warning/critical threshold를 계정별 설정
- 알림은 window별로 throttle
- reset 알림은 후속 기능으로 분리

### 6. 로컬 로그 기반 analytics는 별도 신뢰도 등급이 필요

ccusage와 TokenMeter는 local JSONL/session data를 활용해 daily/monthly/session report, cost estimate, model breakdown을 제공합니다. 이 방식은 훌륭하지만 공식 billing source와 동일하게 취급하면 안 됩니다.

MVP 반영:

- `isAuthoritative=false`를 UI에 표시
- 로컬 분석은 `참고값` 배지 사용
- raw prompt/file path 저장 금지
- requestId deduplication 개념 채택

### 7. Export/API는 power user에게 유용하다

ccusage는 JSON output, ClaudeMeter는 JSON export를 제공합니다. 우리도 Widget snapshot과 별개로 export를 제공하면 CLI, Raycast, statusline 연동에 유리합니다.

MVP 반영:

- `usage-snapshot.json` 스키마를 안정적으로 유지
- 후속: menu bar app에서 JSON/CSV export
- 후속: `llm-token-widget export --json` CLI

### 8. Cost hiding/privacy mode는 기본 설계에 넣어야 한다

UsageScope는 cost/usage/local history 조합, CodexBar는 privacy-first를 강조합니다. 사용량 위젯은 데스크탑에 노출되므로 금액과 계정명 숨김이 필요합니다.

MVP 반영:

- 계정명 alias 필수
- 금액 숨김 옵션
- 위젯별 privacy mode
- screenshot-friendly compact mode

### 9. 모바일은 Mac companion sync가 현실적이다

Usage for Claude iOS companion은 iPhone/iPad에서 직접 Claude 사용량을 추적하지 않고 Mac 앱이 수집한 데이터를 iCloud로 동기화해 표시합니다. 이 방식은 현재 설계와 일치합니다.

MVP 이후 반영:

- Mac app이 source of truth
- iCloud에는 sanitized snapshot/history만 sync
- iOS app/widget은 표시와 pull-to-refresh request만 담당

### 10. Provider status polling은 차별화 요소가 될 수 있다

CodexBar는 provider incident badge를 표시합니다. 사용자가 rate limit과 provider 장애를 혼동하지 않게 해줍니다.

후속 반영:

- OpenAI/Anthropic status API 또는 status page polling
- `provider_incident` health reason 추가
- 위젯에서는 작은 incident badge만 표시

## 피해야 할 아이디어

### 브라우저 쿠키/로컬스토리지 자동 읽기

CodexBar 같은 고급 도구는 browser cookie/local storage를 opt-in으로 읽을 수 있습니다. 기능은 강력하지만 권한 설명, Full Disk Access, Keychain prompt, App Store 심사 리스크가 커집니다.

MVP에서는 하지 않습니다.

### 다른 앱이 만든 OAuth token 무단 재사용

TokenMeter와 일부 Claude 사용량 앱은 Claude Code의 Keychain token을 읽어 real rate limit을 가져옵니다. 이 방식은 UX가 좋을 수 있지만 macOS Keychain prompt, token refresh, provider 정책 변경에 취약합니다.

MVP에서는 공식 admin/API key와 사용자가 명시 제공한 credential만 사용합니다. 로컬 CLI token 재사용은 실험 기능으로만 검토합니다.

### Provider 수를 초반부터 넓히기

UsageScope, CodexBar는 수십 개 provider를 지원합니다. 하지만 초기 제품에서 provider 수를 넓히면 사용량 semantics, reset window, billing source가 모두 달라져 품질이 떨어질 수 있습니다.

MVP는 OpenAI/Codex API key, Anthropic/Claude Admin API, 수동 예산에 집중합니다.

## 우선순위 반영안

1. Widget snapshot과 계정 상태 모델에 `resetAt`, `isAuthoritative`, `sourceLabel`을 포함한다.
2. 메뉴바 기본 표시는 전체 상태 1개로 시작하고, provider별 아이콘은 설정으로 둔다.
3. 등록 플로우 첫 화면에 자동 감지 후보를 보여준다.
4. 알림 threshold를 MVP에 포함한다.
5. privacy mode를 MVP에 포함한다.
6. JSON export는 schema 안정화 후 추가한다.
7. iOS는 Mac companion + iCloud snapshot sync로 확장한다.

