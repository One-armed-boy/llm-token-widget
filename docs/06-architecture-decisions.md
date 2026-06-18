# 기술 결정 기록

## ADR-001: 네이티브 Swift + WidgetKit 사용

상태: 채택

이유:

- macOS 위젯은 WidgetKit이 표준 경로입니다.
- Keychain, App Group, WidgetCenter, BackgroundTasks와 자연스럽게 통합됩니다.
- iOS 위젯 확장 시 같은 Swift 도메인 모델을 재사용할 수 있습니다.

대안:

- Electron + native widget bridge: 위젯 구현 복잡도가 커집니다.
- 웹 대시보드 우선: macOS 위젯 목표와 맞지 않습니다.

## ADR-002: 위젯은 표시 전용으로 둔다

상태: 채택

이유:

- Widget extension은 지속 polling에 적합하지 않습니다.
- 비밀값을 extension에 노출하지 않는 편이 보안상 낫습니다.
- 네트워크 실패나 rate limit 처리를 앱/collector 한 곳에 집중할 수 있습니다.

## ADR-003: 공급자별 원본 데이터를 정규화 snapshot으로 변환한다

상태: 채택

이유:

- OpenAI, Anthropic, ChatGPT workspace, Claude Code OTel의 metric shape가 다릅니다.
- UI가 특정 provider API에 결합되면 모바일 확장이 어려워집니다.
- capability 기반 UI가 가능해집니다.

## ADR-004: 개인 구독 잔여 한도는 공식 API 확인 전까지 추정 또는 미지원으로 표시한다

상태: 채택

이유:

- 개인 Claude Code Pro/Max, Codex Plus/Pro 사용량은 제품 내부 UI와 로컬 세션 정보가 존재하지만, 전체 계정의 권위 있는 공개 사용량 API로 확인되지 않는 영역이 있습니다.
- 비공식 스크래핑은 유지보수성과 보안 리스크가 큽니다.
- 사용자가 잘못된 "남은 한도"를 신뢰하는 것이 가장 큰 제품 리스크입니다.

## ADR-005: MVP는 로컬 우선, 모바일은 snapshot sync로 확장한다

상태: 채택

이유:

- 개인 도구로 시작할 때 서버 운영 비용과 secret custody를 피할 수 있습니다.
- 모바일 위젯은 직접 수집보다 macOS 또는 서버가 만든 snapshot을 읽는 구조가 안정적입니다.
- 팀용 제품으로 전환할 경우 서버 수집기로 자연스럽게 확장할 수 있습니다.

## ADR-006: Widget extension에는 provider credential 접근 권한을 주지 않는다

상태: 채택

이유:

- Widget은 표시 전용이어야 하며, 사용량 수집과 secret 취급은 host app/collector가 담당하는 편이 단순하고 안전합니다.
- App Group은 앱과 extension이 읽을 수 있는 공유 경계이므로 secret 저장소로 쓰지 않습니다.
- Widget은 sanitized snapshot만 읽어도 제품의 1차 목표를 달성할 수 있습니다.

## ADR-007: 등록 대상은 모델이 아니라 계정/사용량 소스로 정의한다

상태: 채택

이유:

- 사용자가 실제로 연결하는 것은 GPT/Claude 모델이 아니라 OpenAI, Anthropic, Claude Code, Codex 사용량 데이터 소스입니다.
- 개인 구독, API key, 조직 관리자 API, 후순위 로컬 참고값은 필요한 권한과 정확도가 다릅니다.
- "계정 추가"와 "사용량 소스 연결"이라는 표현이 오류 상태와 capability 표시를 자연스럽게 만듭니다.

## ADR-008: MVP는 브라우저 세션과 로컬 로그 자동 스캔을 사용하지 않는다

상태: 채택

이유:

- 경쟁 앱들이 이미 WebView 로그인, cookie import, 로컬 JSONL 분석을 강하게 지원합니다. 같은 방향으로 가면 기능 경쟁이 무거워집니다.
- 이 프로젝트는 안전하고 가벼운 다중 계정 위젯에 집중합니다.
- MVP는 공식 API credential, 수동 예산, sanitized snapshot만 사용합니다.
- Full Disk Access, browser cookie, 다른 앱의 OAuth token 재사용을 피하면 보안 설명과 배포 리스크가 줄어듭니다.

후순위:

- 로컬 로그 import와 official-vs-local reconciliation은 경쟁 우위가 될 수 있지만 MVP 이후 별도 opt-in 기능으로 검토합니다.
