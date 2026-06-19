# App Group Snapshot Contract

작성일: 2026-06-19

## 목적

macOS app과 Widget extension은 App Group의 `widget-snapshot.json`으로만 표시 데이터를 공유합니다.

## File Name

```text
widget-snapshot.json
```

## Ownership

| Actor | Permission |
| --- | --- |
| Menu bar app | write/read |
| Widget extension | read only |
| ProviderAdapters | no direct access |
| Keychain/CredentialStore | no direct access |

## Write Contract

The app writes snapshots atomically:

1. encode `WidgetSnapshotDTO`
2. write to `widget-snapshot.json.tmp`
3. fsync when practical
4. replace `widget-snapshot.json`
5. request WidgetKit timeline reload

The app must not write partial JSON to the final path.

## Read Contract

The widget reads snapshots defensively:

1. resolve App Group container
2. if file is missing, show empty state
3. if file is invalid JSON, show corrupt snapshot state
4. if `schemaVersion` is unsupported, show unsupported snapshot state
5. decode DTO
6. render account summary

The widget must not trigger provider collection when read fails.

## App Group Path

The App Group id is defined in [docs/15-macos-project-scaffold-spec.md](15-macos-project-scaffold-spec.md).

Pseudo-code:

```swift
let container = FileManager.default.containerURL(
    forSecurityApplicationGroupIdentifier: "group.com.local.llm-token-widget"
)
let snapshotURL = container.appendingPathComponent("widget-snapshot.json")
```

## Corruption Handling

Widget states:

| State | Meaning |
| --- | --- |
| `missing` | no snapshot has been written yet |
| `corrupt` | JSON could not be decoded |
| `unsupportedVersion` | schemaVersion is not supported |
| `ready` | DTO decoded successfully |

## Security Rules

The snapshot file must pass:

```bash
make snapshot-audit
```

The file must not contain:

- API keys or tokens
- raw API key IDs
- raw organization IDs
- emails
- raw provider responses
- prompts
- local file paths
- repository paths

## Test Requirements

macOS tests should include:

- golden snapshot decode
- missing file read
- invalid JSON read
- unsupported schema version read
- atomic write replacement
- widget target read-only behavior
