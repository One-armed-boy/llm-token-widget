import SnapshotStore
import SwiftUI
import UsageCore
import WidgetKit

struct WidgetSnapshotView: View {
    let readState: SnapshotReadState
    let family: WidgetFamily

    var body: some View {
        switch readState {
        case .loaded(let snapshot):
            LoadedSnapshotView(snapshot: snapshot, family: family)
        case .missing:
            EmptyStateView(title: "No Snapshot", detail: "Open the app to collect usage.")
        case .empty:
            EmptyStateView(title: "Empty Snapshot", detail: "The snapshot file has no content.")
        case .unsupportedVersion(let version):
            EmptyStateView(title: "Unsupported Snapshot", detail: "Schema version \(version)")
        case .corrupted:
            EmptyStateView(title: "Snapshot Error", detail: "The latest snapshot could not be decoded.")
        }
    }
}

private struct LoadedSnapshotView: View {
    let snapshot: WidgetSnapshotDTO
    let family: WidgetFamily

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("LLM Usage")
                        .font(.headline)
                    Text(snapshot.generatedAt, style: .relative)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                HealthBadge(label: "\(snapshot.counts.risky)", systemImage: "exclamationmark.triangle.fill", color: .orange)
            }

            if let bestAccount = snapshot.bestAccount {
                AccountRow(account: bestAccount, isBest: true)
            } else {
                EmptyStateView(title: "No Safe Account", detail: "All accounts need attention.")
            }

            if family != .systemSmall {
                VStack(spacing: 6) {
                    ForEach(snapshot.visibleAttentionAccounts.prefix(3)) { account in
                        AccountRow(account: account, isBest: false)
                    }
                }
            }
        }
        .padding(12)
    }
}

private struct AccountRow: View {
    let account: WidgetAccountDTO
    let isBest: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Label(account.displayName, systemImage: providerIcon)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                Spacer()
                Text(account.health.displayLabel)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(account.health.tint)
            }
            HStack(spacing: 8) {
                ProgressView(value: account.usagePercentValue)
                    .tint(account.health.tint)
                Text(account.usageLabel)
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .frame(width: 46, alignment: .trailing)
            }
            if isBest {
                Text("Recommended for the next task")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(10)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    private var providerIcon: String {
        switch account.provider {
        case .openai: return "sparkles"
        case .anthropic: return "text.bubble"
        case .manual: return "slider.horizontal.3"
        }
    }
}

private struct HealthBadge: View {
    let label: String
    let systemImage: String
    let color: Color

    var body: some View {
        Label(label, systemImage: systemImage)
            .font(.caption.weight(.bold))
            .foregroundStyle(color)
            .labelStyle(.titleAndIcon)
    }
}

private struct EmptyStateView: View {
    let title: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.headline)
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
    }
}

private extension WidgetSnapshotDTO {
    var bestAccount: WidgetAccountDTO? {
        guard let bestAccountId = recommendation.bestAccountId else {
            return nil
        }
        return accounts.first { $0.id == bestAccountId }
    }

    var visibleAttentionAccounts: [WidgetAccountDTO] {
        accounts.filter { account in
            [.risky, .stale, .authFailed, .unsupported, .unknown].contains(account.health)
        }
    }
}

private extension WidgetAccountDTO {
    var usagePercentValue: Double? {
        usagePercent.map { min(max($0 / 100, 0), 1) }
    }

    var usageLabel: String {
        guard let usagePercent else {
            return "n/a"
        }
        return "\(Int(usagePercent.rounded()))%"
    }
}

private extension AccountHealthDTO {
    var displayLabel: String {
        switch self {
        case .ok: return "OK"
        case .risky: return "Risk"
        case .stale: return "Stale"
        case .authFailed: return "Auth"
        case .unsupported: return "Manual"
        case .unknown: return "Unknown"
        }
    }

    var tint: Color {
        switch self {
        case .ok: return .green
        case .risky: return .orange
        case .stale: return .blue
        case .authFailed: return .red
        case .unsupported: return .gray
        case .unknown: return .purple
        }
    }
}
