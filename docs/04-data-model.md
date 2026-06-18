# 데이터 모델

## 원칙

공급자 API 응답을 그대로 UI에 연결하지 않습니다. 모든 수집 결과는 provider-neutral snapshot으로 정규화합니다.

## 주요 엔티티

### Account

```swift
struct Account: Identifiable, Codable {
    let id: UUID
    var displayName: String
    var provider: ProviderKind
    var source: UsageSourceKind
    var credentialRef: CredentialRef
    var budget: BudgetPolicy?
    var thresholds: ThresholdPolicy
    var isEnabled: Bool
}
```

### ProviderKind

```swift
enum ProviderKind: String, Codable {
    case openAI
    case codex
    case anthropic
    case claudeCode
}
```

Codex와 Claude Code는 제품 표시용 provider이며, 실제 수집 adapter는 OpenAI API, ChatGPT workspace analytics, Anthropic Admin API, OTel 등으로 나뉩니다.

### UsageSourceKind

```swift
enum UsageSourceKind: String, Codable {
    case openAIAdminUsage
    case openAICodexAPIKey
    case chatGPTWorkspaceAnalytics
    case anthropicAdminUsage
    case claudeCodeAnalytics
    case claudeCodeOpenTelemetry
    case localSessionEstimate
    case manualBudget
}
```

### UsageSnapshot

```swift
struct UsageSnapshot: Codable {
    let schemaVersion: Int
    let accountId: UUID
    let provider: ProviderKind
    let source: UsageSourceKind
    let collectedAt: Date
    let period: UsagePeriod
    let metrics: UsageMetrics
    let capability: ProviderCapability
    let health: AccountHealth
    let errors: [CollectionError]
}
```

### UsageMetrics

```swift
struct UsageMetrics: Codable {
    var inputTokens: Int64?
    var cachedInputTokens: Int64?
    var outputTokens: Int64?
    var reasoningTokens: Int64?
    var totalTokens: Int64?
    var requests: Int64?
    var costUSD: Decimal?
    var creditsUsed: Decimal?
    var creditsRemaining: Decimal?
    var quotaPercentUsed: Double?
    var budgetPercentUsed: Double?
    var resetAt: Date?
    var breakdowns: [UsageBreakdown]
}
```

### UsageBreakdown

```swift
struct UsageBreakdown: Codable {
    var dimension: BreakdownDimension
    var key: String
    var label: String?
    var metrics: UsageMetrics
}
```

예: model, project, API key, user, client, workspace, tool, MCP server.

### AccountHealth

```swift
enum HealthLevel: String, Codable {
    case ok
    case warning
    case critical
    case unknown
}

struct AccountHealth: Codable {
    var level: HealthLevel
    var reason: String
    var freshnessSeconds: TimeInterval
    var isAuthoritative: Bool
}
```

## 저장소

### SQLite tables

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  source TEXT NOT NULL,
  display_name TEXT NOT NULL,
  credential_ref TEXT NOT NULL,
  budget_json TEXT,
  thresholds_json TEXT NOT NULL,
  is_enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE usage_snapshots (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  source TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  capability_json TEXT NOT NULL,
  health_json TEXT NOT NULL,
  errors_json TEXT NOT NULL
);

CREATE INDEX idx_usage_snapshots_account_period
ON usage_snapshots(account_id, period_start, period_end);
```

### Widget snapshot

Widget extension은 SQLite 전체를 열지 않고, App Group의 작은 JSON 파일을 읽습니다.

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-18T12:00:00Z",
  "overall_health": "warning",
  "accounts": [
    {
      "id": "6B6D8E3D-44B0-41CB-B3EF-C04523C5B0B4",
      "name": "OpenAI Work",
      "provider": "codex",
      "health": "warning",
      "primary_value": "$42.18",
      "secondary_value": "72% of monthly budget",
      "freshness": "3m",
      "is_authoritative": true
    }
  ]
}
```

## 예산 정책

공급자별 quota remaining이 없더라도 사용자가 월간 예산을 설정하면 상태 판단이 가능합니다.

```swift
struct BudgetPolicy: Codable {
    var monthlyUSD: Decimal?
    var monthlyCredits: Decimal?
    var monthlyTokens: Int64?
    var resetDay: Int
    var timezone: String
}
```

## 마이그레이션

Snapshot에는 `schemaVersion`을 둡니다. 모바일 또는 서버 동기화가 들어가면 같은 스키마를 유지하고, breaking change는 새 version으로 처리합니다.

