# Swift Widget Contract

작성일: 2026-06-19

## 목적

macOS 앱과 WidgetKit extension은 `widget-snapshot.json`만 공유합니다. Widget extension은 provider API, Keychain, raw response, collector code를 직접 사용하지 않습니다.

정식 JSON 계약:

- [schemas/widget-snapshot.schema.json](../schemas/widget-snapshot.schema.json)

## Reader 책임

Widget reader는 다음 순서로 동작합니다.

1. App Group container에서 `widget-snapshot.json`을 읽는다.
2. JSON decode 전에 파일이 없거나 비어 있으면 empty state를 표시한다.
3. `schemaVersion == 1`인지 확인한다.
4. `WidgetSnapshotDTO`로 decode한다.
5. decode 실패 시 corrupted snapshot state를 표시하고 provider refresh를 시도하지 않는다.

## Swift DTO 초안

```swift
struct WidgetSnapshotDTO: Codable, Equatable {
    let schemaVersion: Int
    let generatedAt: Date
    let recommendation: RecommendationDTO
    let accounts: [WidgetAccountDTO]
    let counts: AccountCountsDTO
}

struct RecommendationDTO: Codable, Equatable {
    let bestAccountId: String?
    let riskyAccountIds: [String]
    let staleAccountIds: [String]
    let authFailedAccountIds: [String]
}

struct WidgetAccountDTO: Codable, Equatable, Identifiable {
    let id: String
    let provider: ProviderDTO
    let displayName: String
    let health: AccountHealthDTO
    let usagePercent: Double?
    let lastUpdatedAt: Date?
    let periodStart: Date?
    let periodEnd: Date?
    let metrics: UsageMetricsDTO
}

struct UsageMetricsDTO: Codable, Equatable {
    let costUsd: Double?
    let budgetUsd: Double?
    let inputTokens: Double?
    let outputTokens: Double?
    let totalTokens: Double?
}

struct AccountCountsDTO: Codable, Equatable {
    let total: Int
    let ok: Int
    let risky: Int
    let stale: Int
    let authFailed: Int
    let unsupported: Int
    let unknown: Int
}

enum ProviderDTO: String, Codable {
    case openai
    case anthropic
    case manual
}

enum AccountHealthDTO: String, Codable {
    case ok
    case risky
    case stale
    case authFailed
    case unsupported
    case unknown
}
```

## Date Decoding

JSON date strings are ISO-8601 timestamps. Swift reader should use an ISO-8601 decoder strategy.

```swift
let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601
```

Nullable date fields:

- `lastUpdatedAt`
- `periodStart`
- `periodEnd`

## Nullable Metrics

Metrics can be `nil` when a provider does not expose that value, a manual budget omits tokens, or a collector error prevents snapshot generation.

Nullable metric fields:

- `costUsd`
- `budgetUsd`
- `inputTokens`
- `outputTokens`
- `totalTokens`
- `usagePercent`

Widget UI must not infer missing values as `0`. It should render missing as unknown or hidden.

## Security Contract

The DTO must not include:

- API keys or tokens
- raw API key IDs
- raw organization IDs
- emails
- raw provider responses
- prompts
- local file paths
- repository paths

If a Swift implementation needs a field not listed in the schema, update the schema, audit, golden fixture, and this document in the same change.

## Rendering Guidance

- `generatedAt` is displayed as last updated.
- `bestAccountId == nil` means no safe recommendation.
- `authFailed`, `unsupported`, and `unknown` need distinct visual states.
- `usagePercent == nil` means usage cannot be compared by budget.
- Counts are precomputed for compact widget rendering and should not be recomputed in the widget.
