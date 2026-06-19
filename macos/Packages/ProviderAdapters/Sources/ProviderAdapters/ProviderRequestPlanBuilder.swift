import Foundation

public struct OpenAIRequestPlanConfig: Equatable, Sendable {
    public let accountId: String
    public let apiKey: String
    public let period: UnixSecondsPeriod
    public let limit: Int?
    public let groupBy: [String]?
    public let usagePage: String?
    public let costsPage: String?
    public let baseURL: URL?

    public init(
        accountId: String,
        apiKey: String,
        period: UnixSecondsPeriod,
        limit: Int? = nil,
        groupBy: [String]? = nil,
        usagePage: String? = nil,
        costsPage: String? = nil,
        baseURL: URL? = nil
    ) {
        self.accountId = accountId
        self.apiKey = apiKey
        self.period = period
        self.limit = limit
        self.groupBy = groupBy
        self.usagePage = usagePage
        self.costsPage = costsPage
        self.baseURL = baseURL
    }
}

public struct AnthropicRequestPlanConfig: Equatable, Sendable {
    public let accountId: String
    public let apiKey: String
    public let period: DateStringPeriod
    public let limit: Int?
    public let usagePage: String?
    public let costsPage: String?
    public let anthropicVersion: String?
    public let baseURL: URL?

    public init(
        accountId: String,
        apiKey: String,
        period: DateStringPeriod,
        limit: Int? = nil,
        usagePage: String? = nil,
        costsPage: String? = nil,
        anthropicVersion: String? = nil,
        baseURL: URL? = nil
    ) {
        self.accountId = accountId
        self.apiKey = apiKey
        self.period = period
        self.limit = limit
        self.usagePage = usagePage
        self.costsPage = costsPage
        self.anthropicVersion = anthropicVersion
        self.baseURL = baseURL
    }
}

public struct UnixSecondsPeriod: Equatable, Sendable {
    public let startTime: Int
    public let endTime: Int?

    public init(startTime: Int, endTime: Int? = nil) {
        self.startTime = startTime
        self.endTime = endTime
    }
}

public struct DateStringPeriod: Equatable, Sendable {
    public let startTime: String
    public let endTime: String?

    public init(startTime: String, endTime: String? = nil) {
        self.startTime = startTime
        self.endTime = endTime
    }
}

public enum ProviderRequestPlanBuilder {
    public static let defaultLimit = 31
    public static let defaultOpenAIBaseURL = URL(string: "https://api.openai.com")!
    public static let defaultAnthropicBaseURL = URL(string: "https://api.anthropic.com")!
    public static let defaultAnthropicVersion = "2023-06-01"

    public static func buildOpenAI(_ config: OpenAIRequestPlanConfig) throws -> ProviderRequestPlan {
        let apiKey = try requireSecret(config.apiKey)
        let startTime = try requireUnixSeconds(config.period.startTime, fieldName: "period.startTime")
        let endTime = try optionalUnixSeconds(config.period.endTime, fieldName: "period.endTime")
        let limit = try normalizeLimit(config.limit)
        let groupBy = try normalizeGroupBy(config.groupBy, fallback: ["project_id"])
        let baseURL = config.baseURL ?? defaultOpenAIBaseURL
        let headers = [
            "Authorization": "Bearer \(apiKey)",
            "Content-Type": "application/json"
        ]

        return ProviderRequestPlan(
            provider: .openai,
            accountId: config.accountId,
            requests: [
                ProviderRequest(
                    name: "usage",
                    method: "GET",
                    url: try buildURL(
                        baseURL: baseURL,
                        path: "/v1/organization/usage/completions",
                        queryItems: [
                            URLQueryItem(name: "start_time", value: String(startTime)),
                            optionalQueryItem(name: "end_time", value: endTime.map(String.init)),
                            URLQueryItem(name: "limit", value: String(limit)),
                            optionalQueryItem(name: "page", value: config.usagePage)
                        ].compactMap { $0 } + groupBy.map { URLQueryItem(name: "group_by", value: $0) }
                    ),
                    headers: headers
                ),
                ProviderRequest(
                    name: "costs",
                    method: "GET",
                    url: try buildURL(
                        baseURL: baseURL,
                        path: "/v1/organization/costs",
                        queryItems: [
                            URLQueryItem(name: "start_time", value: String(startTime)),
                            optionalQueryItem(name: "end_time", value: endTime.map(String.init)),
                            URLQueryItem(name: "limit", value: String(limit)),
                            optionalQueryItem(name: "page", value: config.costsPage)
                        ].compactMap { $0 } + groupBy.map { URLQueryItem(name: "group_by", value: $0) }
                    ),
                    headers: headers
                )
            ]
        )
    }

    public static func buildAnthropic(_ config: AnthropicRequestPlanConfig) throws -> ProviderRequestPlan {
        let apiKey = try requireSecret(config.apiKey)
        let startTime = try requireDate(config.period.startTime, fieldName: "period.startTime")
        let endTime = try optionalDate(config.period.endTime, fieldName: "period.endTime")
        let limit = try normalizeLimit(config.limit)
        let baseURL = config.baseURL ?? defaultAnthropicBaseURL
        let headers = [
            "x-api-key": apiKey,
            "anthropic-version": config.anthropicVersion ?? defaultAnthropicVersion
        ]

        return ProviderRequestPlan(
            provider: .anthropic,
            accountId: config.accountId,
            requests: [
                ProviderRequest(
                    name: "usage",
                    method: "GET",
                    url: try buildURL(
                        baseURL: baseURL,
                        path: "/v1/organizations/usage_report/messages",
                        queryItems: [
                            URLQueryItem(name: "starting_at", value: startTime),
                            optionalQueryItem(name: "ending_at", value: endTime),
                            URLQueryItem(name: "limit", value: String(limit)),
                            optionalQueryItem(name: "page", value: config.usagePage)
                        ].compactMap { $0 }
                    ),
                    headers: headers
                ),
                ProviderRequest(
                    name: "costs",
                    method: "GET",
                    url: try buildURL(
                        baseURL: baseURL,
                        path: "/v1/organizations/cost_report",
                        queryItems: [
                            URLQueryItem(name: "starting_at", value: startTime),
                            optionalQueryItem(name: "ending_at", value: endTime),
                            URLQueryItem(name: "limit", value: String(limit)),
                            optionalQueryItem(name: "page", value: config.costsPage)
                        ].compactMap { $0 }
                    ),
                    headers: headers
                )
            ]
        )
    }

    private static func requireSecret(_ value: String) throws -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.isEmpty == false else {
            throw ProviderRequestPlanError.apiKeyRequired
        }
        return value
    }

    private static func requireUnixSeconds(_ value: Int, fieldName: String) throws -> Int {
        guard value > 0 else {
            throw ProviderRequestPlanError.invalidUnixSeconds(fieldName)
        }
        return value
    }

    private static func optionalUnixSeconds(_ value: Int?, fieldName: String) throws -> Int? {
        guard let value else {
            return nil
        }
        return try requireUnixSeconds(value, fieldName: fieldName)
    }

    private static func requireDate(_ value: String, fieldName: String) throws -> String {
        guard iso8601Formatter.date(from: value) != nil else {
            throw ProviderRequestPlanError.invalidDate(fieldName)
        }
        return String(value.prefix(10))
    }

    private static func optionalDate(_ value: String?, fieldName: String) throws -> String? {
        guard let value else {
            return nil
        }
        return try requireDate(value, fieldName: fieldName)
    }

    private static func normalizeLimit(_ value: Int?) throws -> Int {
        guard let value else {
            return defaultLimit
        }
        guard (1...180).contains(value) else {
            throw ProviderRequestPlanError.invalidLimit
        }
        return value
    }

    private static func normalizeGroupBy(_ value: [String]?, fallback: [String]) throws -> [String] {
        guard let value else {
            return fallback
        }
        guard value.allSatisfy({ $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false }) else {
            throw ProviderRequestPlanError.invalidGroupBy
        }
        return value
    }

    private static func optionalQueryItem(name: String, value: String?) -> URLQueryItem? {
        guard let value else {
            return nil
        }
        return URLQueryItem(name: name, value: value)
    }

    private static func buildURL(baseURL: URL, path: String, queryItems: [URLQueryItem]) throws -> URL {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            throw ProviderRequestPlanError.invalidBaseURL(baseURL.absoluteString)
        }
        components.path = path
        components.queryItems = queryItems
        guard let url = components.url else {
            throw ProviderRequestPlanError.unableToBuildURL("\(baseURL.absoluteString)\(path)")
        }
        return url
    }

    private static let iso8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}
