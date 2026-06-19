import Foundation

public enum ProviderKind: String, Equatable, Sendable {
    case openai
    case anthropic
}

public struct ProviderRequestPlan: Equatable, Sendable {
    public let provider: ProviderKind
    public let accountId: String
    public let requests: [ProviderRequest]

    public init(provider: ProviderKind, accountId: String, requests: [ProviderRequest]) {
        self.provider = provider
        self.accountId = accountId
        self.requests = requests
    }
}

public struct ProviderRequest: Equatable, Sendable {
    public let name: String
    public let method: String
    public let url: URL
    public let headers: [String: String]

    public init(name: String, method: String, url: URL, headers: [String: String]) {
        self.name = name
        self.method = method
        self.url = url
        self.headers = headers
    }
}

public struct RedactedProviderRequestPlan: Equatable, Sendable {
    public let provider: ProviderKind
    public let accountId: String
    public let requests: [RedactedProviderRequest]
}

public struct RedactedProviderRequest: Equatable, Sendable {
    public let name: String
    public let method: String
    public let url: URL
    public let redactedHeaders: [String: String]
}

public enum ProviderRequestPlanError: Error, Equatable, LocalizedError {
    case apiKeyRequired
    case invalidUnixSeconds(String)
    case invalidDate(String)
    case invalidLimit
    case invalidGroupBy
    case invalidBaseURL(String)
    case unableToBuildURL(String)

    public var errorDescription: String? {
        switch self {
        case .apiKeyRequired:
            return "apiKey is required"
        case .invalidUnixSeconds(let field):
            return "\(field) must be unix seconds"
        case .invalidDate(let field):
            return "\(field) must be an ISO date string"
        case .invalidLimit:
            return "limit must be an integer between 1 and 180"
        case .invalidGroupBy:
            return "groupBy must be an array of non-empty strings"
        case .invalidBaseURL(let value):
            return "baseUrl is invalid: \(value)"
        case .unableToBuildURL(let value):
            return "Unable to build provider URL: \(value)"
        }
    }
}

public extension ProviderRequestPlan {
    func redacted() -> RedactedProviderRequestPlan {
        RedactedProviderRequestPlan(
            provider: provider,
            accountId: accountId,
            requests: requests.map { request in
                RedactedProviderRequest(
                    name: request.name,
                    method: request.method,
                    url: request.url,
                    redactedHeaders: Dictionary(uniqueKeysWithValues: request.headers.keys.map { ($0, "[redacted]") })
                )
            }
        )
    }
}
