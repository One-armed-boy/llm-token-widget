# 로드맵

## Milestone 0: 설계 확정

- 제품 요구사항 문서화
- provider별 지원 범위 정리
- macOS WidgetKit 제약 반영
- 데이터 모델 초안 작성
- 보안 리스크 리뷰
- 계정 등록 UX 플로우 정의
- 유사 사례 리서치 반영
- 경쟁 앱 심층 분석 반영

완료 기준: 구현자가 계정 등록, 수집, 캐시, 위젯 표시 경계를 설명할 수 있다.

## Milestone 1: macOS 로컬 MVP

- Xcode 프로젝트 생성
- Swift Package로 domain/core 분리
- 메뉴바 앱 shell 구현
- App Group 설정
- Keychain credential 저장
- 수동 계정 등록 UI
- 정적/mock snapshot 위젯 표시
- 보안 체크리스트 기반 secret/log/snapshot 검증
- privacy mode와 threshold notification 초안
- source confidence와 best account recommendation mock

완료 기준: API 연결 없이도 N개 mock 계정의 상태, 추천 계정, 위험 계정이 위젯에 표시된다.

## Milestone 2: OpenAI/Codex API key 사용량

- OpenAI Admin Usage adapter
- OpenAI Costs adapter
- 최소 비용/사용량 요약
- budget policy 기반 상태 계산
- 수동/주기 갱신

완료 기준: OpenAI Platform admin key로 Codex API key 사용량과 비용을 표시한다.

## Milestone 3: Anthropic/Claude API 사용량

- Anthropic Admin API credential 검증
- Usage/Cost report adapter
- 최소 비용/사용량 요약
- provider capability 표시

완료 기준: Anthropic 관리자 권한 계정의 조직 또는 워크스페이스 사용량을 표시한다.

## Milestone 4: 가벼운 확장

- 수동 예산 계정 polish
- provider status polling 검토
- notification polish
- 데이터 지연/권한 부족 UX 강화

완료 기준: 공식 API, 수동 예산, 미지원 상태를 UI에서 명확히 구분한다.

## Milestone 5: 모바일 준비

- iOS app target 추가
- 공용 domain model 재사용
- iCloud snapshot sync 또는 서버 sync PoC
- iOS WidgetKit layout

완료 기준: macOS에서 수집한 snapshot을 iOS 위젯에서 읽을 수 있다.

## 구현 순서

1. Swift/Xcode 프로젝트 스캐폴드
2. Domain model과 mock provider
3. Widget snapshot writer/reader
4. Menu bar UI
5. 계정 등록 UX
6. Security logging/redaction
7. OpenAI adapter
8. Anthropic adapter
9. 상태 계산과 오류 UX
10. 모바일 동기화 PoC

## 후순위 아이디어

다음 기능은 경쟁 우위가 있을 수 있지만 MVP에서는 제외합니다.

- 공식 사용량과 로컬 로그 추정치 reconciliation
- Claude/Codex 로컬 로그 자동 스캔
- WebView login 또는 browser cookie 기반 개인 구독 quota
- provider 대량 확장
- 팀/조직 governance dashboard
- CLI decision API
