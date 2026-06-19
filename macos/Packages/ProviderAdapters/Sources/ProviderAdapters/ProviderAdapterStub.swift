import Foundation

public enum ProviderAdapterAvailability: Equatable {
    case stubbed
}

public struct ProviderAdapterStub {
    public let availability: ProviderAdapterAvailability

    public init(availability: ProviderAdapterAvailability = .stubbed) {
        self.availability = availability
    }
}
