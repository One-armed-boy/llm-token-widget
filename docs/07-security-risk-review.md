# 보안 리스크 리뷰

작성일: 2026-06-18

## 결론

현재 아키텍처는 방향이 맞지만, 구현 시 다음 원칙을 반드시 지켜야 합니다.

- 위젯은 비밀값에 접근하지 않는다.
- App Group에는 표시용 snapshot만 둔다.
- provider admin key는 Keychain에만 저장한다.
- 원본 API 응답은 기본 저장하지 않는다.
- 로컬 세션 로그, OTel 이벤트, browser cookie/localStorage는 MVP에서 읽지 않는다.
- 개인 구독 계정의 비공식 스크래핑은 하지 않는다.

Apple은 Keychain을 작은 사용자 비밀 저장소로 제공하고, App Group은 앱과 extension 사이의 데이터 공유 수단으로 설명합니다. 이 프로젝트에서는 둘을 섞지 않고, Keychain은 secret storage, App Group은 sanitized display cache로만 씁니다.

참고:

- Apple Keychain Services: https://developer.apple.com/documentation/security/keychain-services
- Apple App Groups: https://developer.apple.com/documentation/xcode/configuring-app-groups
- OWASP MASVS Storage: https://mas.owasp.org/MASVS/05-MASVS-STORAGE/

## 리스크 레지스터

| 리스크 | 심각도 | 원인 | 처리 |
| --- | --- | --- | --- |
| Admin/API key 유출 | 높음 | Keychain 외부 저장, 로그 출력, crash report 포함 | Keychain only, 로그 redaction, 키 값 UI 재표시 금지 |
| Widget extension의 secret 접근 | 높음 | Keychain access group을 app/widget에 함께 부여 | MVP에서는 widget에 Keychain entitlement 부여 금지 |
| App Group snapshot 과다 노출 | 중간 | account email, org id, cost, user breakdown 저장 | alias 중심 저장, raw id hash 처리, widget용 최소 필드만 저장 |
| 원본 API 응답 보관 | 중간 | 디버깅 편의로 JSON 저장 | 기본 비활성화, debug export는 민감 필드 제거 후 사용자 명시 동작 |
| 비공식 스크래핑 | 높음 | 개인 Claude/Codex 잔여량 자동화 욕심 | 정책상 금지, 공식 API/수동 예산만 지원 |
| 로컬 Claude/Codex 로그 파싱의 과수집 | 중간 | session log에 prompt, file path, repo 정보 포함 가능 | MVP 제외, 후속 opt-in에서도 token/cost summary만 추출 |
| OTel 수집기 오용 | 중간 | tool activity와 파일 경로가 event에 포함될 수 있음 | MVP 제외, 후속 opt-in에서도 local-only receiver와 allowlist metric |
| iCloud/server sync로 secret 확산 | 높음 | 모바일 확장 시 credential 동기화 유혹 | iCloud에는 snapshot만 sync, secret sync 금지 |
| 사용자 화면 프라이버시 | 낮음-중간 | 위젯이 데스크탑에 비용/계정명을 노출 | privacy mode, alias, 금액 숨김 옵션 |
| 공급자 API 권한 부족 오판 | 중간 | 403/404/지원 안 됨을 0 사용량으로 표시 | health/error state 분리, 숫자 대체 금지 |
| 네트워크/TLS 설정 오용 | 중간 | corporate proxy, custom CA 설정 | 기본 URLSession TLS 사용, custom CA는 명시 설정과 경고 |
| 서드파티 dependency 취약점 | 중간 | SQLite/Keychain wrapper 무분별 도입 | 의존성 최소화, Swift 표준/Apple API 우선, lockfile 관리 |

## 구현 필수 통제

### Credential 저장

- `CredentialRef`만 SQLite에 저장합니다.
- 실제 secret은 Keychain item으로 저장합니다.
- Keychain item label에는 provider와 account alias만 넣고, secret 일부를 이름에 포함하지 않습니다.
- 키 검증 실패 시 secret 전체를 로그에 찍지 않습니다.
- 계정 삭제 시 Keychain item과 snapshot을 함께 삭제합니다.

### Widget 경계

Widget extension은 다음을 하지 않습니다.

- Keychain 읽기
- provider API 호출
- SQLite history 직접 조회
- refresh token 또는 API key 보유

Widget extension은 App Group의 `widget-snapshot.json`만 읽습니다.

### Snapshot 최소화

Widget snapshot에는 다음만 둡니다.

- account id
- 사용자가 지정한 display name 또는 alias
- provider kind
- health level
- primary/secondary display value
- freshness
- authoritative 여부

다음은 snapshot에 넣지 않습니다.

- API key id 원문
- organization id 원문
- user email 원문
- raw API response
- prompt, file path, repository path
- provider access token

### 로그와 디버그

- 로그에는 request URL의 query parameter 중 account 식별자를 마스킹합니다.
- HTTP body는 기본적으로 저장하지 않습니다.
- debug export는 사용자 명시 동작으로만 생성합니다.
- debug export 파일에는 만료 시간과 삭제 버튼을 제공합니다.

### 권한 모델

계정 등록 시 provider별로 필요한 권한을 명확히 보여줍니다.

- OpenAI: Admin Usage/Costs 조회가 가능한 key
- Anthropic: Admin API usage/cost 조회 권한
- 개인 구독 계정: 공식 API로 잔여량 확인이 안 될 수 있음을 명시

권한 부족은 `permission_denied`, 미지원은 `unsupported`, 인증 실패는 `auth_failed`로 분리합니다.

## 테스트 체크리스트

- Keychain에만 secret이 저장되는지 확인
- App Group snapshot에 secret, email, org id 원문이 없는지 확인
- `log stream`, crash report, debug export에 key가 남지 않는지 확인
- widget process에서 provider API 호출이 없는지 확인
- 계정 삭제 후 Keychain item과 snapshot이 제거되는지 확인
- 401, 403, 404, 429, 5xx를 각각 다른 UI 상태로 표시하는지 확인
- privacy mode에서 금액과 계정명이 숨겨지는지 확인

## 남은 결정

- snapshot에 cost 금액을 기본 표시할지, privacy mode를 기본값으로 둘지
- 팀 배포에서 org/user 식별자를 hash 처리할지 완전 제거할지
- 후속 로컬 로그/OTel adapter를 도입할지
