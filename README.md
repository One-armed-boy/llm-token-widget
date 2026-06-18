# LLM Token Widget

Claude, Claude Code, Codex/OpenAI 사용량을 여러 계정 기준으로 한눈에 보는 macOS 위젯 프로젝트입니다.

현재 저장소는 구현 전 설계 단계입니다. 1차 목표는 macOS 메뉴바 앱 + WidgetKit 위젯이며, 이후 iOS 위젯으로 확장할 수 있도록 데이터 수집 계층과 표시 계층을 분리합니다.

## 설계 문서

- [제품 요구사항](docs/01-product-requirements.md)
- [아키텍처](docs/02-architecture.md)
- [데이터 소스와 API 경계](docs/03-data-sources.md)
- [데이터 모델](docs/04-data-model.md)
- [로드맵](docs/05-roadmap.md)
- [기술 결정 기록](docs/06-architecture-decisions.md)
- [보안 리스크 리뷰](docs/07-security-risk-review.md)
- [계정 등록 UX 플로우](docs/08-account-onboarding-flow.md)
- [유사 사례 리서치](docs/09-reference-product-research.md)
- [경쟁 앱 심층 분석](docs/10-competitive-deep-dive.md)
- [경량 플랜 재조정과 적대적 검증](docs/11-lightweight-plan-review.md)
- [테스트 하네스 전략](docs/12-test-harness-strategy.md)
- [현재 환경 커버리지 리서치](docs/13-current-env-coverage-research.md)

## 개발 하네스

현재 단계의 표준 검증 명령:

```bash
make verify
```

현재 환경에서 커버리지 리포트를 확인할 때:

```bash
make test-coverage
```

provider fixture parser만 빠르게 확인할 때:

```bash
make test-providers
```

실제 provider API 호출 전 request plan만 확인할 때:

```bash
make e2e-openai-dry-run
make e2e-anthropic-dry-run
```

실제 provider API opt-in E2E:

```bash
OPENAI_ADMIN_KEY=... REAL_E2E_START_TIME=1780272000 make e2e-openai
ANTHROPIC_ADMIN_KEY=... REAL_E2E_START_DATE=2026-06-01T00:00:00.000Z make e2e-anthropic
```

실제 E2E는 `make verify`에 포함하지 않습니다. 생성되는 `reports/real-e2e/*.json`에는 raw provider response나 secret을 저장하지 않습니다.

macOS/Xcode 환경이 연결되면 같은 검증 계약에 Swift unit test, WidgetKit build, XCUITest, screenshot smoke를 붙입니다.

## 핵심 방향

WidgetKit 위젯은 지속 실행 프로세스가 아니므로, 위젯이 직접 실시간 수집을 담당하지 않습니다.

1. macOS 앱/메뉴바 에이전트가 계정별 사용량을 수집합니다.
2. 수집 결과를 표준 스냅샷으로 정규화해 App Group 컨테이너에 저장합니다.
3. WidgetKit 위젯은 저장된 스냅샷만 읽고 표시합니다.
4. 모바일 확장은 같은 정규화 모델을 공유하고, iCloud 또는 서버 동기화 계층을 추가합니다.

## 확인된 제약

- macOS 위젯의 갱신은 OS 정책에 의해 제한되므로, 위젯의 "실시간"은 초 단위가 아니라 최신 캐시 기반의 근실시간 표시로 정의합니다.
- Claude Code와 Codex는 플랜, 인증 방식, 조직 권한에 따라 사용량 조회 방식이 다릅니다.
- 개인 구독 계정의 정확한 잔여 한도는 공개 API가 확인되는 범위 안에서만 지원하고, 확인되지 않는 영역은 수동 입력/추정/미지원 상태로 명확히 표시합니다.
