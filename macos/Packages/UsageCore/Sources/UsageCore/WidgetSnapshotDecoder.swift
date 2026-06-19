import Foundation

public enum WidgetSnapshotDecodeError: Error, Equatable {
    case emptyData
    case unsupportedSchemaVersion(Int)
}

public enum WidgetSnapshotDecoder {
    public static let currentSchemaVersion = 1

    public static func decode(_ data: Data) throws -> WidgetSnapshotDTO {
        guard data.isEmpty == false else {
            throw WidgetSnapshotDecodeError.emptyData
        }

        let version = try JSONDecoder().decode(SchemaProbe.self, from: data).schemaVersion
        guard version == currentSchemaVersion else {
            throw WidgetSnapshotDecodeError.unsupportedSchemaVersion(version)
        }

        return try makeDecoder().decode(WidgetSnapshotDTO.self, from: data)
    }

    public static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)

            if let date = fractionalISO8601Formatter.date(from: value) {
                return date
            }
            if let date = plainISO8601Formatter.date(from: value) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid ISO-8601 timestamp: \(value)"
            )
        }
        return decoder
    }

    private static let fractionalISO8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let plainISO8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}

private struct SchemaProbe: Decodable {
    let schemaVersion: Int
}
