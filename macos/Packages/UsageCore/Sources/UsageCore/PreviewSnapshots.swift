import Foundation

public enum PreviewSnapshots {
    public static let golden = WidgetSnapshotDTO(
        schemaVersion: 1,
        generatedAt: Date(timeIntervalSince1970: 1_781_611_200),
        recommendation: RecommendationDTO(
            bestAccountId: "openai-prod",
            riskyAccountIds: ["openai-risk"],
            staleAccountIds: ["anthropic-stale"],
            authFailedAccountIds: ["anthropic-auth"]
        ),
        accounts: [
            WidgetAccountDTO(
                id: "openai-prod",
                provider: .openai,
                displayName: "OpenAI Prod",
                health: .ok,
                usagePercent: 21.3,
                lastUpdatedAt: Date(timeIntervalSince1970: 1_781_610_300),
                periodStart: Date(timeIntervalSince1970: 1_780_272_000),
                periodEnd: Date(timeIntervalSince1970: 1_782_879_999),
                metrics: UsageMetricsDTO(
                    costUsd: 42.5,
                    budgetUsd: 200,
                    inputTokens: 1_250_000,
                    outputTokens: 410_000,
                    totalTokens: 1_660_000
                )
            ),
            WidgetAccountDTO(
                id: "openai-risk",
                provider: .openai,
                displayName: "OpenAI Risk",
                health: .risky,
                usagePercent: 92,
                lastUpdatedAt: Date(timeIntervalSince1970: 1_781_609_400),
                periodStart: Date(timeIntervalSince1970: 1_780_272_000),
                periodEnd: Date(timeIntervalSince1970: 1_782_879_999),
                metrics: UsageMetricsDTO(
                    costUsd: 184,
                    budgetUsd: 200,
                    inputTokens: 8_000_000,
                    outputTokens: 2_500_000,
                    totalTokens: 10_500_000
                )
            ),
            WidgetAccountDTO(
                id: "anthropic-stale",
                provider: .anthropic,
                displayName: "Claude Team",
                health: .stale,
                usagePercent: 18.3,
                lastUpdatedAt: Date(timeIntervalSince1970: 1_781_413_200),
                periodStart: Date(timeIntervalSince1970: 1_780_272_000),
                periodEnd: Date(timeIntervalSince1970: 1_782_879_999),
                metrics: UsageMetricsDTO(
                    costUsd: 22,
                    budgetUsd: 120,
                    inputTokens: 640_000,
                    outputTokens: 180_000,
                    totalTokens: 820_000
                )
            ),
            WidgetAccountDTO(
                id: "anthropic-auth",
                provider: .anthropic,
                displayName: "Claude Auth Failed",
                health: .authFailed,
                usagePercent: nil,
                lastUpdatedAt: nil,
                periodStart: nil,
                periodEnd: nil,
                metrics: UsageMetricsDTO(
                    costUsd: nil,
                    budgetUsd: nil,
                    inputTokens: nil,
                    outputTokens: nil,
                    totalTokens: nil
                )
            )
        ],
        counts: AccountCountsDTO(
            total: 6,
            ok: 2,
            risky: 1,
            stale: 1,
            authFailed: 1,
            unsupported: 1,
            unknown: 0
        )
    )
}
