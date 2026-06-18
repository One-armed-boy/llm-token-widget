# 경량 플랜 재조정과 적대적 검증

작성일: 2026-06-18

## 재조정된 포지션

제품 포지션:

> 안전하고 가벼운 다중 계정 AI 사용량 위젯

경쟁 앱처럼 provider 수, 브라우저 쿠키, WebView 로그인, 로컬 로그 분석, 복잡한 차트를 넓히지 않습니다. 대신 다음을 작게 잘합니다.

- macOS WidgetKit first
- Claude/Codex/OpenAI/Anthropic 계정 N개
- 공식 API key 또는 수동 예산만 사용
- 브라우저 쿠키, WebView 로그인, Full Disk Access 없음
- 계정별 상태와 추천 계정 표시
- privacy mode

## MVP 범위

### 포함

- macOS 메뉴바 앱
- WidgetKit 위젯
- mock/sample mode
- OpenAI Admin Usage/Costs API
- Anthropic Admin Usage/Cost API
- 수동 예산 계정
- Keychain-backed `CredentialStore`
- App Group sanitized snapshot
- source confidence
- 간단한 best account recommendation
- privacy mode

### 제외

- WebView login
- browser cookie/localStorage import
- 다른 앱의 OAuth token 재사용
- Full Disk Access
- 자동 로컬 JSONL 스캔
- official-vs-local reconciliation
- 팀/조직 dashboard
- provider 대량 확장
- CLI automation

## 타당성 검증

### 강한 점

- 구현 범위가 명확하고 작습니다.
- App Store와 회사 Mac 환경에서 설명하기 쉽습니다.
- 보안 prompt가 적어 onboarding 이탈이 줄어듭니다.
- WidgetKit-first UX가 제품의 첫 화면과 맞습니다.
- 기존 앱들이 복잡해질수록 "설정 적고 안전한 앱" 포지션이 살아납니다.

### 약한 점

- 개인 Claude/Codex 구독의 실제 5시간/주간 quota를 자동으로 못 보여줄 가능성이 큽니다.
- 경쟁 앱이 보여주는 "진짜 rate limit"보다 덜 강력해 보일 수 있습니다.
- Admin API key가 없는 일반 개인 사용자는 수동 예산 외에 얻는 값이 적을 수 있습니다.
- 추천 기능은 데이터가 약하면 신뢰를 얻기 어렵습니다.

### 판단

이 플랜은 "heavy user의 모든 quota를 완벽히 추적"하는 제품으로는 약합니다. 대신 "여러 API/업무 계정의 사용 가능 상태를 안전하게 위젯에서 보는 앱"으로는 타당합니다.

## 유저 유즈플로우 적대적 검증

### 공격 1: 사용자는 API key를 넣기 싫다

문제:

- 첫 경험이 "Admin key를 넣으세요"이면 이탈할 수 있습니다.

대응:

- 첫 실행에서 `샘플 데이터로 위젯 보기`를 1순위로 제공합니다.
- `수동 예산 계정`을 key 없는 시작점으로 제공합니다.
- API key 입력 전 "브라우저 쿠키/Full Disk Access를 쓰지 않기 때문에 key가 필요하다"는 이유를 짧게 설명합니다.

통과 기준:

- API key 없이도 60초 안에 위젯을 추가해볼 수 있어야 합니다.

### 공격 2: 수동 예산은 귀찮고 부정확하다

문제:

- 수동 예산만으로는 제품 가치가 낮아질 수 있습니다.

대응:

- 수동 예산은 fallback입니다. OpenAI/Anthropic Admin API 계정을 1차 권장합니다.
- 수동 계정은 "정확한 사용량"이 아니라 "주의 표시용"으로 라벨링합니다.
- 수동 계정에는 매일/매주 입력을 요구하지 않고 월 예산과 reset day만 받습니다.

통과 기준:

- 수동 계정은 `참고` badge를 항상 표시합니다.

### 공격 3: 경쟁 앱은 진짜 Claude/Codex quota를 보여준다

문제:

- WebView/cookie/token 기반 앱과 비교하면 기능이 약해 보입니다.

대응:

- MVP 문구를 "구독 quota tracker"로 잡지 않습니다.
- "No cookies. No Full Disk Access. Official API or manual only."를 명시합니다.
- 개인 구독 quota 자동 조회는 disabled 카드로 두고, 왜 지원하지 않는지 설명합니다.

통과 기준:

- 사용자가 이 앱을 "덜 강력하지만 더 안전한 앱"으로 이해해야 합니다.

### 공격 4: 위젯 갱신이 늦으면 실시간이라고 느끼지 못한다

문제:

- WidgetKit refresh는 OS 정책에 묶입니다.

대응:

- 위젯에는 `last updated`를 반드시 표시합니다.
- 메뉴바 앱에는 수동 refresh를 둡니다.
- "실시간"이라는 표현을 피하고 "latest snapshot" 또는 "최근 갱신"으로 표현합니다.

통과 기준:

- stale 상태가 정상 숫자처럼 보이면 실패입니다.

### 공격 5: 추천 계정이 틀리면 신뢰가 깨진다

문제:

- 추천은 단순 규칙이라 edge case에서 틀릴 수 있습니다.

대응:

- 추천 이유를 한 줄로 표시합니다.
- confidence를 high/medium/low로 둡니다.
- 데이터가 부족하면 추천하지 않고 `판단 불가`를 표시합니다.

통과 기준:

- 추천은 항상 이유와 freshness를 포함해야 합니다.

### 공격 6: Widget에 금액/계정명이 보이는 것이 민감하다

문제:

- 데스크탑 위젯은 화면 공유와 스크린샷에 노출됩니다.

대응:

- first-run에서 privacy mode 선택을 받습니다.
- Small 위젯 기본값은 alias + 상태만 표시합니다.
- 금액 표시를 opt-in으로 둡니다.

통과 기준:

- 기본 위젯 snapshot에는 email, org id, API key id 원문이 없어야 합니다.

## 보안 적대적 검증

### 공격 1: App Group에 민감 정보가 들어간다

방어:

- Widget snapshot schema를 allowlist 방식으로 정의합니다.
- snapshot writer test에서 금지 필드가 들어가면 실패하게 합니다.

금지:

- email
- org id 원문
- API key id 원문
- raw API response
- prompt
- local file path
- access token

### 공격 2: 로그에 API key가 찍힌다

방어:

- HTTP Authorization header는 로깅하지 않습니다.
- URL query에 project/org 식별자가 있으면 redaction합니다.
- error message에는 response body를 기본 포함하지 않습니다.

테스트:

- `log stream` 기반 수동 점검
- redactor unit test

### 공격 3: Widget extension이 secret을 읽는다

방어:

- Widget target에는 Keychain access group을 주지 않습니다.
- Widget code에는 provider adapter dependency를 링크하지 않습니다.
- Widget은 snapshot reader module만 의존합니다.

테스트:

- target dependency inspection
- widget process에서 네트워크 호출 없음 확인

### 공격 4: Admin key 권한이 과하다

방어:

- provider별 필요 권한 설명을 credential form 앞에 둡니다.
- 가능한 경우 read-only/admin usage 전용 key를 권장합니다.
- 생성 권한이 필요 없음을 명확히 설명합니다.

한계:

- provider가 fine-grained usage-only key를 제공하지 않으면 앱이 해결할 수 없습니다.

### 공격 5: 앱이 안전하다고 말하지만 실제로는 많은 파일을 읽는다

방어:

- MVP에서는 자동 로컬 로그 스캔을 하지 않습니다.
- 파일 선택 기반 import도 MVP에서 제외합니다.
- data access 화면에 "읽는 위치: 없음 또는 App Group snapshot"을 표시합니다.

## Go / No-Go 기준

MVP를 진행할 조건:

- API key 없이도 샘플 위젯을 볼 수 있다.
- WebView login, browser cookie, Full Disk Access 없이 OpenAI/Anthropic API 계정이 동작한다.
- Widget snapshot에 민감 정보가 없다.
- 추천 계정이 부족한 데이터에서는 나오지 않는다.
- privacy mode가 기본 UX에 포함된다.

중단하거나 방향 수정할 조건:

- 주요 사용자 대부분이 개인 Claude/Codex 구독 quota 자동 조회만 원한다.
- OpenAI/Anthropic Admin API credential을 넣을 의사가 거의 없다.
- Widget refresh 지연 때문에 핵심 UX가 무너진다.
- 경쟁 앱 대비 "안전한 대신 덜 유용함"으로만 인식된다.

## 문구 원칙

사용하지 않을 표현:

- 실시간 전체 quota
- 정확한 개인 구독 잔여량
- 모든 provider 지원
- 자동 감지로 모든 것을 처리

사용할 표현:

- 최신 스냅샷
- 공식 API 또는 수동 예산
- 브라우저 쿠키 없음
- Full Disk Access 없음
- 안전하게 여러 계정 상태 확인

