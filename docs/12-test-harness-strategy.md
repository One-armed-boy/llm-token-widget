# 테스트 하네스 전략

작성일: 2026-06-18

## 목표

이 프로젝트는 LLM이 상당 부분을 개발할 수 있어야 합니다. 그러려면 LLM이 코드를 수정한 뒤 직접 실행하고, 실패를 해석하고, 다시 고칠 수 있는 테스트 표면이 필요합니다.

목표는 macOS 위젯 전체를 매번 완전 자동 조작하는 것이 아닙니다. 핵심은 제품의 중요한 동작을 headless, mock, snapshot, screenshot 기반으로 반복 검증할 수 있게 만드는 것입니다.

이 전략은 `../trading-bot`의 하네스 원칙에서 다음 패턴만 가져옵니다.

- 표준 검증 명령 하나를 둔다.
- fixture/mock 기반 실행을 1급으로 둔다.
- 산출물과 감사 로그를 사람이 읽을 수 있게 남긴다.
- 큰 리뷰 절차보다 빠른 regression gate를 우선한다.

## 하네스 북극성

1. LLM이 API key 없이도 핵심 UX를 재현할 수 있다.
2. Widget snapshot의 보안 경계가 자동 검증된다.
3. 추천 계정, 위험 계정, stale/error 상태가 fixture로 재현된다.
4. macOS/WidgetKit 특유의 flaky 영역은 test host와 screenshot으로 우회한다.
5. 실제 provider API E2E는 opt-in으로만 실행된다.

## 테스트 레이어

### 1. Core Unit Tests

대상:

- 상태 계산
- 추천 점수
- source confidence
- privacy redaction
- freshness/stale 판단
- budget threshold
- provider capability

특징:

- Swift Package에서 headless로 실행
- macOS UI나 Keychain이 필요 없어야 함
- 가장 많이 실행되는 regression gate

예상 명령:

```bash
make test-core
```

### 2. Provider Fixture Tests

대상:

- OpenAI Usage/Costs 응답 parser
- Anthropic Usage/Cost 응답 parser
- 401, 403, 404, 429, 5xx error mapping
- pagination, empty usage, partial data

원칙:

- 실제 API key 없이 fixture만으로 실행
- provider raw response fixture는 민감 정보가 제거된 최소 예시만 저장
- parser test 없이 provider adapter를 추가하지 않음

예상 명령:

```bash
make test-providers
```

### 3. Snapshot Audit

대상:

- `widget-snapshot.json` schema
- forbidden field absence
- privacy mode output
- 추천 계정과 위험 계정 summary
- stale/error state serialization

금지 필드:

- API key/token
- raw API key id
- raw organization id
- email
- raw provider response
- prompt
- local file path
- repository path

예상 명령:

```bash
make snapshot-audit
```

통과 기준:

- snapshot JSON은 allowlist schema로 검증
- forbidden pattern scan 통과
- privacy mode fixture에서 금액/계정명이 숨겨짐

### 4. Mock E2E

대상:

- 앱이 mock accounts를 로드
- collector가 mock snapshot 생성
- recommendation engine이 best account 산출
- widget snapshot writer가 App Group 또는 test output에 JSON 생성
- snapshot audit 통과

Mock 계정 세트:

- 정상 OpenAI account
- 예산 90% 이상 위험 account
- stale Anthropic account
- auth failed account
- unsupported personal subscription account
- manual budget account

예상 명령:

```bash
make e2e-mock
```

산출물:

```text
reports/mock-e2e/widget-snapshot.json
reports/mock-e2e/summary.json
reports/mock-e2e/redaction-audit.json
```

### 5. UI and Screenshot Tests

대상:

- onboarding
- account list
- widget preview
- privacy mode
- error detail

원칙:

- XCUITest는 `accessibilityIdentifier`만 사용
- 메뉴바 popover만 자동화하기 어렵다면 같은 UI state를 test host window로 렌더링
- WidgetKit 실제 갤러리 추가는 수동 smoke로 분리

예상 명령:

```bash
make ui-screenshots
```

산출물:

```text
reports/ui-screenshots/onboarding.png
reports/ui-screenshots/account-list.png
reports/ui-screenshots/widget-preview-small.png
reports/ui-screenshots/widget-preview-medium.png
```

### 6. Real Provider E2E

대상:

- OpenAI Admin Usage/Costs API
- Anthropic Admin Usage/Cost API

원칙:

- 기본 `make verify`에는 포함하지 않음
- 환경 변수가 있을 때만 실행
- Keychain test namespace 사용
- 로그 redaction 확인
- API response body 저장 금지

예상 명령:

```bash
OPENAI_ADMIN_KEY=... make e2e-openai
ANTHROPIC_ADMIN_KEY=... make e2e-anthropic
```

## 표준 명령 계약

최종 목표:

```bash
make verify
```

`make verify`는 다음을 순서대로 실행합니다.

1. docs/schema sanity
2. core unit tests
3. provider fixture tests
4. snapshot audit
5. mock E2E

초기 문서 단계에서는 `make verify`가 문서 링크와 기준 파일 존재만 확인합니다. 구현이 추가될수록 같은 명령에 테스트를 붙입니다.

## AGENTS.md 계약

LLM이 작업할 때 `AGENTS.md`는 다음을 알려야 합니다.

- 프로젝트 포지션
- 금지된 보안 동작
- 기준 문서
- 표준 검증 명령
- snapshot 금지 필드
- 테스트 가능한 변경 단위

`AGENTS.md`는 짧게 유지하고, 상세 테스트 전략은 이 문서를 기준으로 둡니다.

## Fixture 설계

Fixture는 세 종류로 나눕니다.

```text
fixtures/
  providers/
    openai/
    anthropic/
  scenarios/
    mock-accounts.json
    privacy-mode.json
    stale-and-errors.json
  snapshots/
    expected-widget-snapshot.json
```

원칙:

- fixture는 실제 key, email, org id를 포함하지 않음
- raw provider fixture는 parser에 필요한 필드만 포함
- scenario fixture는 UX 상태를 재현하는 데 집중

## Accessibility Identifier 규칙

UI 테스트가 가능한 앱을 만들기 위해 주요 UI에는 stable identifier를 둡니다.

예:

```text
onboarding.sampleDataButton
accountList.addAccountButton
accountRow.healthBadge
accountRow.refreshButton
credentialForm.apiKeyField
validation.authStatus
widgetPreview.small
privacyMode.toggle
errorDetail.reason
```

## 수동 Smoke 테스트

완전 자동화하지 않는 영역:

- macOS widget gallery에 실제 extension이 나타나는지
- 사용자가 데스크탑에 위젯을 추가할 수 있는지
- notarized app 설치 후 Gatekeeper 동작

수동 체크리스트는 후속 `docs/manual-smoke-test.md`로 분리합니다.

## Go / No-Go

LLM 주도 개발을 허용하기 위한 최소 조건:

- `make verify`가 존재하고 현재 단계에서 통과한다.
- mock scenario로 위젯 snapshot을 만들 수 있다.
- snapshot audit이 forbidden field를 잡는다.
- 추천 계정 로직은 unit test와 mock E2E 둘 다에서 검증된다.
- 실제 provider E2E는 opt-in이며 기본 검증을 느리게 만들지 않는다.

## 하네스 확장 원칙

- 새 provider를 추가하면 fixture parser test를 먼저 추가한다.
- 새 UI flow를 추가하면 accessibility identifier와 screenshot fixture를 함께 추가한다.
- 새 snapshot field를 추가하면 snapshot audit allowlist를 함께 수정한다.
- 새 secret handling을 추가하면 redaction test를 함께 추가한다.

