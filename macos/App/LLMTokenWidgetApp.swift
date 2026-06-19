import SnapshotStore
import SwiftUI
import UsageCore
import WidgetKit

@main
struct LLMTokenWidgetApp: App {
    private let snapshotStore = AppGroupSnapshotStore(
        appGroupId: AppGroupConstants.localAppGroupId,
        fileName: AppGroupConstants.snapshotFileName
    )

    var body: some Scene {
        MenuBarExtra("LLM Usage", systemImage: "chart.bar.xaxis") {
            MenuBarRootView(snapshotStore: snapshotStore)
                .frame(width: 360, minHeight: 440)
        }
        .menuBarExtraStyle(.window)
    }
}
