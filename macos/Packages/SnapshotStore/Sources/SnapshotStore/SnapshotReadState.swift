import Foundation
import UsageCore

public enum SnapshotReadState: Equatable {
    case missing
    case empty
    case unsupportedVersion(Int)
    case corrupted(String)
    case loaded(WidgetSnapshotDTO)
}
