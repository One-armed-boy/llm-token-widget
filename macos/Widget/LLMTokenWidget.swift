import SnapshotStore
import SwiftUI
import UsageCore
import WidgetKit

struct LLMTokenWidgetEntry: TimelineEntry {
    let date: Date
    let readState: SnapshotReadState
}

struct LLMTokenWidgetProvider: TimelineProvider {
    private let snapshotStore = AppGroupSnapshotStore(
        appGroupId: AppGroupConstants.localAppGroupId,
        fileName: AppGroupConstants.snapshotFileName
    )

    func placeholder(in context: Context) -> LLMTokenWidgetEntry {
        LLMTokenWidgetEntry(date: Date(), readState: .loaded(PreviewSnapshots.golden))
    }

    func getSnapshot(in context: Context, completion: @escaping (LLMTokenWidgetEntry) -> Void) {
        completion(LLMTokenWidgetEntry(date: Date(), readState: snapshotStore.readSnapshot(fallback: PreviewSnapshots.golden)))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LLMTokenWidgetEntry>) -> Void) {
        let entry = LLMTokenWidgetEntry(date: Date(), readState: snapshotStore.readSnapshot())
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60))))
    }
}

struct LLMTokenWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LLMTokenWidgetEntry

    var body: some View {
        WidgetSnapshotView(readState: entry.readState, family: family)
            .containerBackground(.background, for: .widget)
    }
}

struct LLMTokenWidget: Widget {
    let kind = "LLMTokenWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LLMTokenWidgetProvider()) { entry in
            LLMTokenWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("LLM Usage")
        .description("Shows the latest sanitized account usage snapshot.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
