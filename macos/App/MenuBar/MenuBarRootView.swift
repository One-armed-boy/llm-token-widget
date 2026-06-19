import SnapshotStore
import SwiftUI
import UsageCore
import WidgetKit

struct MenuBarRootView: View {
    let snapshotStore: AppGroupSnapshotStore

    @State private var readState: SnapshotReadState = .loaded(PreviewSnapshots.golden)

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            header
            WidgetSnapshotView(readState: readState, family: .systemMedium)
            Divider()
            Button {
                readState = snapshotStore.readSnapshot(fallback: PreviewSnapshots.golden)
                WidgetCenter.shared.reloadAllTimelines()
            } label: {
                Label("Refresh Snapshot", systemImage: "arrow.clockwise")
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(16)
        .onAppear {
            readState = snapshotStore.readSnapshot(fallback: PreviewSnapshots.golden)
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("LLM Usage")
                    .font(.headline)
                Text("Latest snapshot")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chart.bar.doc.horizontal")
                .font(.title3)
                .foregroundStyle(.tint)
        }
    }
}
