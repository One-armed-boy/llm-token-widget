import Foundation

public enum AppGroupConstants {
    public static let localAppGroupId = "group.com.local.llm-token-widget"
    public static let snapshotFileName = "widget-snapshot.json"
}

public struct WidgetSnapshotDTO: Codable, Equatable, Sendable {
    public let schemaVersion: Int
    public let generatedAt: Date
    public let recommendation: RecommendationDTO
    public let accounts: [WidgetAccountDTO]
    public let counts: AccountCountsDTO

    public init(
        schemaVersion: Int,
        generatedAt: Date,
        recommendation: RecommendationDTO,
        accounts: [WidgetAccountDTO],
        counts: AccountCountsDTO
    ) {
        self.schemaVersion = schemaVersion
        self.generatedAt = generatedAt
        self.recommendation = recommendation
        self.accounts = accounts
        self.counts = counts
    }
}

public struct RecommendationDTO: Codable, Equatable, Sendable {
    public let bestAccountId: String?
    public let riskyAccountIds: [String]
    public let staleAccountIds: [String]
    public let authFailedAccountIds: [String]

    public init(
        bestAccountId: String?,
        riskyAccountIds: [String],
        staleAccountIds: [String],
        authFailedAccountIds: [String]
    ) {
        self.bestAccountId = bestAccountId
        self.riskyAccountIds = riskyAccountIds
        self.staleAccountIds = staleAccountIds
        self.authFailedAccountIds = authFailedAccountIds
    }
}

public struct WidgetAccountDTO: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let provider: ProviderDTO
    public let displayName: String
    public let health: AccountHealthDTO
    public let usagePercent: Double?
    public let lastUpdatedAt: Date?
    public let periodStart: Date?
    public let periodEnd: Date?
    public let metrics: UsageMetricsDTO

    public init(
        id: String,
        provider: ProviderDTO,
        displayName: String,
        health: AccountHealthDTO,
        usagePercent: Double?,
        lastUpdatedAt: Date?,
        periodStart: Date?,
        periodEnd: Date?,
        metrics: UsageMetricsDTO
    ) {
        self.id = id
        self.provider = provider
        self.displayName = displayName
        self.health = health
        self.usagePercent = usagePercent
        self.lastUpdatedAt = lastUpdatedAt
        self.periodStart = periodStart
        self.periodEnd = periodEnd
        self.metrics = metrics
    }
}

public struct UsageMetricsDTO: Codable, Equatable, Sendable {
    public let costUsd: Double?
    public let budgetUsd: Double?
    public let inputTokens: Double?
    public let outputTokens: Double?
    public let totalTokens: Double?

    public init(
        costUsd: Double?,
        budgetUsd: Double?,
        inputTokens: Double?,
        outputTokens: Double?,
        totalTokens: Double?
    ) {
        self.costUsd = costUsd
        self.budgetUsd = budgetUsd
        self.inputTokens = inputTokens
        self.outputTokens = outputTokens
        self.totalTokens = totalTokens
    }
}

public struct AccountCountsDTO: Codable, Equatable, Sendable {
    public let total: Int
    public let ok: Int
    public let risky: Int
    public let stale: Int
    public let authFailed: Int
    public let unsupported: Int
    public let unknown: Int

    public init(
        total: Int,
        ok: Int,
        risky: Int,
        stale: Int,
        authFailed: Int,
        unsupported: Int,
        unknown: Int
    ) {
        self.total = total
        self.ok = ok
        self.risky = risky
        self.stale = stale
        self.authFailed = authFailed
        self.unsupported = unsupported
        self.unknown = unknown
    }
}

public enum ProviderDTO: String, Codable, Sendable {
    case openai
    case anthropic
    case manual
}

public enum AccountHealthDTO: String, Codable, Sendable {
    case ok
    case risky
    case stale
    case authFailed
    case unsupported
    case unknown
}
