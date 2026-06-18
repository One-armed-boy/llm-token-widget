# 계정 등록 UX 플로우

## 결론

사용자에게 "LLM 등록"이라고 말하면 흐름이 어색합니다. 이 제품이 등록하는 것은 모델이 아니라 "사용량을 읽어올 계정 또는 데이터 소스"입니다.

따라서 UI 용어는 다음처럼 잡습니다.

- 버튼: `계정 추가`
- 화면 제목: `사용량 소스 연결`
- provider 카드: `OpenAI / Codex`, `Anthropic / Claude`, `수동 예산`
- 완료 후 표시 단위: `계정`

## 좋은 등록 흐름

### 1. 계정 추가

첫 화면에서는 기술 용어를 최소화합니다.

```text
무엇의 사용량을 볼까요?

[OpenAI / Codex]
API key 또는 Codex API key 사용량과 비용

[Anthropic / Claude]
Claude API 또는 Claude Code 조직 사용량

[수동 예산]
자동 수집 없이 예산과 상태만 표시
```

선택 카드에는 "정확도"와 "필요 권한"을 짧게 표시합니다.

- 권위 있는 청구 데이터
- 관리자 권한 필요
- 수동 입력

### 2. 사용량 소스 선택

Provider 선택 뒤 실제 source를 고릅니다.

OpenAI / Codex:

- OpenAI API 사용량
- Codex API key 사용량
- Codex ChatGPT 구독 계정은 MVP에서 자동 조회 제외

Codex ChatGPT 구독 계정을 선택하면 바로 key 입력으로 보내지 않습니다. 다음 안내를 먼저 보여줍니다.

```text
개인 ChatGPT 구독 기반 Codex의 정확한 잔여 한도는 현재 자동 조회가 제한될 수 있습니다.
대신 수동 예산으로 표시할 수 있습니다.
```

Anthropic / Claude:

- Claude API 사용량
- Claude Code 조직/개인 플랜 자동 조회는 MVP에서 제외

### 3. 권한 안내

키 입력 전에 "왜 이 권한이 필요한지"를 보여줍니다.

```text
필요한 권한
- 사용량 조회
- 비용 조회
- 프로젝트/API key별 breakdown 조회

이 앱은 요청 생성 권한을 사용하지 않습니다.
키는 이 Mac의 Keychain에 저장됩니다.
```

provider 문서 링크와 "나중에 설정"을 제공합니다.

### 4. Credential 입력

입력 화면은 단순해야 합니다.

- 표시 이름
- API/Admin key
- 선택: organization/workspace id
- 선택: 월간 예산

키 입력 필드는 기본 마스킹하고, 붙여넣기 후 마지막 4자리만 표시합니다. 저장 후에는 전체 키를 다시 보여주지 않습니다.

### 5. 검증

검증은 세 단계를 분리해서 보여줍니다.

1. 인증 확인
2. 권한 확인
3. 최근 사용량 샘플 조회

각 단계의 실패를 다르게 표시합니다.

- 인증 실패: key가 틀렸거나 만료됨
- 권한 부족: admin/usage 권한이 없음
- 데이터 없음: 인증은 됐지만 기간 내 사용량 없음
- 지원 안 됨: 이 플랜 또는 인증 방식에서는 자동 조회 불가

### 6. 예산과 임계값

권위 있는 quota remaining이 없을 수 있으므로 예산 설정을 자연스럽게 넣습니다.

```text
월간 예산을 설정하면 provider가 잔여 한도를 제공하지 않아도 상태를 판단할 수 있습니다.
```

기본값:

- 주의: 70%
- 위험: 90%
- stale warning: 30분
- stale critical: 6시간

### 7. 미리보기

완료 전에 widget에 어떻게 보일지 보여줍니다.

```text
OpenAI Work
$42.18 · 월 예산의 72%
3분 전 갱신 · 권위 있는 비용 데이터
```

미리보기에서 사용자가 수정할 수 있는 것:

- 표시 이름
- 위젯 표시값: 비용 우선 / 토큰 우선 / 남은 비율 우선
- privacy mode: 금액 숨김 / 계정명 숨김

### 8. 완료

완료 후 바로 수동 갱신을 실행하고, WidgetCenter reload를 요청합니다.

## N개 계정 관리 UX

계정 목록은 provider가 아니라 상태 중심으로 정렬합니다.

1. 위험
2. 주의
3. 오래된 데이터
4. 정상
5. 비활성

각 행의 기본 구조:

```text
[상태점] OpenAI Work      $42.18 / $60
       Codex API key     3분 전 · 비용 데이터
```

빠른 액션:

- 지금 갱신
- 위젯에서 숨기기
- 예산 수정
- credential 교체
- 삭제

## 자연스럽지 않은 흐름과 수정안

| 어색한 흐름 | 문제 | 수정 |
| --- | --- | --- |
| "LLM 추가" | 모델과 계정을 혼동 | "계정 추가" 또는 "사용량 소스 연결" |
| provider 선택 직후 key 입력 | 왜 admin key가 필요한지 불안함 | 권한 안내를 먼저 보여줌 |
| 개인 구독 계정에 API key 입력 요구 | Codex/Claude Code 구독 사용자의 mental model과 다름 | 자동 조회 가능 여부를 먼저 판정 |
| 실패를 모두 "연결 실패"로 표시 | 사용자가 해결 방법을 모름 | 인증/권한/미지원/데이터 없음 분리 |
| 숫자가 없으면 0 표시 | 사용량 0과 수집 실패가 혼동 | `알 수 없음`, `권한 필요`, `지원 안 됨` 표시 |
| 모든 breakdown을 첫 화면에 표시 | 위젯의 판단성이 떨어짐 | 상세 breakdown은 앱 안의 account detail로 이동 |

## 첫 실행 온보딩

첫 실행은 3단계로 끝냅니다.

1. 이 앱이 하는 일
   - 여러 AI 사용량 계정을 한 화면에 모음
   - 위젯은 캐시된 요약만 표시

2. 보안 안내
   - 키는 Keychain에 저장
   - 위젯에는 키가 전달되지 않음
   - 비공식 스크래핑 없음

3. 첫 계정 추가
   - `계정 추가`
   - `샘플 데이터로 먼저 보기`

샘플 데이터 모드를 제공하면 API key 없이도 위젯 UX를 먼저 확인할 수 있습니다.

## MVP 화면 목록

- Welcome
- Add Account
- Provider Source Picker
- Permission Explainer
- Credential Form
- Validation Progress
- Budget and Threshold
- Widget Preview
- Account List
- Account Detail
- Error Detail

## 구현 우선순위

MVP에서는 다음 흐름만 완성도 있게 만듭니다.

1. 샘플 데이터로 보기
2. OpenAI / Codex API key 사용량 연결
3. Anthropic Admin API 연결
4. 수동 예산 계정

Claude Code 로컬 참고값과 ChatGPT workspace analytics는 안내 문구와 disabled/coming soon 상태로 둡니다.
