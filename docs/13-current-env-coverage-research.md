# 현재 환경 커버리지 리서치

작성일: 2026-06-18

## 결론

현재 Linux/Node 환경에서도 제품 리스크의 상당 부분은 검증할 수 있습니다. 다만 WidgetKit extension 생성, widget debugging, XCUITest, Xcode Cloud 실행은 Apple SDK와 Xcode가 필요한 영역이므로 macOS 또는 macOS CI로 넘겨야 합니다.

## 현재 환경에서 계속 강화할 영역

1. Domain logic coverage
   - 계정 health, 추천 점수, stale 판단, budget threshold, privacy redaction을 순수 함수로 유지합니다.
   - `make test-coverage`로 Node 내장 coverage를 확인합니다.

2. Fixture contract tests
   - canonical mock scenario가 항상 같은 widget summary를 만드는지 고정합니다.
   - provider fixture를 추가할 때 parser test를 먼저 추가합니다.

3. Snapshot audit
   - WidgetKit이 읽는 JSON은 allowlist schema와 forbidden pattern scan을 통과해야 합니다.
   - API key, token, email, raw response, 로컬 경로는 실패로 처리합니다.

4. CLI E2E
   - `make verify`는 API key 없이 mock snapshot 생성과 redaction audit까지 실행합니다.
   - 산출물은 `reports/mock-e2e/`에 남기되 git에는 포함하지 않습니다.

5. Provider adapter tests
   - 실제 OpenAI/Anthropic API 호출 전, sanitized fixture 기반 parser와 error mapping을 구현합니다.
   - 401, 403, 404, 429, 5xx, pagination, empty usage, partial data를 fixture로 분리합니다.

## macOS 환경으로 넘길 영역

1. WidgetKit extension build
   - Apple 문서는 Xcode에서 app project에 Widget Extension target을 추가하는 흐름을 기준으로 설명합니다.

2. Widget debugging and preview
   - Widget debugging은 Xcode에서 widget extension target을 실행하는 방식이 필요합니다.
   - Widget preview는 sample timeline으로 UI 상태를 확인하는 데 사용할 수 있습니다.

3. XCUITest and accessibility
   - XCTest/XCUIAutomation은 앱 UI 조작과 사용자 흐름 검증에 적합합니다.
   - 이 repo에서는 SwiftUI 주요 control에 stable accessibility identifier를 부여하는 계약을 유지합니다.

4. macOS CI
   - GitHub-hosted runners는 macOS runner를 제공합니다.
   - Xcode Cloud는 Apple 개발자용 CI/CD로 build와 automated test를 병렬 실행할 수 있습니다.

## 이번 리서치 후 반영한 변경

- `make test-coverage` 추가
- Node coverage threshold 추가
- domain edge-case tests 보강
- snapshot audit 실패 케이스 보강
- canonical fixture contract test 추가

## 참고 자료

- Apple Developer Documentation: Creating a widget extension
  - https://developer.apple.com/documentation/widgetkit/creating-a-widget-extension
- Apple Developer Documentation: Debugging widgets
  - https://developer.apple.com/documentation/widgetkit/debugging-widgets
- Apple Developer Documentation: Widget preview API
  - https://developer.apple.com/documentation/widgetkit/preview%28_%3Aas%3Awidget%3Atimeline%3A%29
- Apple Developer Documentation: XCTest
  - https://developer.apple.com/documentation/xctest
- Apple Developer: Record, replay, and review UI automation with Xcode
  - https://developer.apple.com/videos/play/wwdc2025/344/
- GitHub Docs: GitHub-hosted runners
  - https://docs.github.com/en/actions/concepts/runners/github-hosted-runners
- Apple Developer: Xcode Cloud
  - https://developer.apple.com/xcode-cloud/
- Node.js Docs: Test runner coverage
  - https://nodejs.org/api/test.html
