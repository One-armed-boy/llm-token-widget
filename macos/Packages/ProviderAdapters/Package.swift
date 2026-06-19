// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "ProviderAdapters",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "ProviderAdapters", targets: ["ProviderAdapters"])
    ],
    targets: [
        .target(name: "ProviderAdapters")
    ]
)
