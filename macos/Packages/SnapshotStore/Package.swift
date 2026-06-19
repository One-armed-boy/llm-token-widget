// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "SnapshotStore",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "SnapshotStore", targets: ["SnapshotStore"])
    ],
    dependencies: [
        .package(path: "../UsageCore")
    ],
    targets: [
        .target(name: "SnapshotStore", dependencies: ["UsageCore"]),
        .testTarget(name: "SnapshotStoreTests", dependencies: ["SnapshotStore", "UsageCore"])
    ]
)
