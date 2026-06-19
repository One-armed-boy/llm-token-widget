# Swift Module Boundaries

작성일: 2026-06-19

## 원칙

Widget extension은 display-only target입니다. Secret, provider networking, collector scheduling은 app target에만 존재합니다.

## Modules

### UsageCore

Allowed responsibilities:

- `WidgetSnapshotDTO`
- `WidgetAccountDTO`
- `RecommendationDTO`
- `UsageMetricsDTO`
- `AccountHealthDTO`
- `ProviderDTO`
- pure display helpers
- schema version constants

Forbidden:

- Keychain
- URLSession provider calls
- App Group path resolution
- raw provider response models

### ProviderAdapters

Allowed responsibilities:

- provider request planning
- URLSession execution
- OpenAI parser
- Anthropic parser
- provider error mapping

Forbidden:

- WidgetKit imports
- Keychain direct access
- App Group file writes
- UI rendering

ProviderAdapters receives credentials as ephemeral values from the app layer. It does not own credential persistence.

### SnapshotStore

Allowed responsibilities:

- App Group container URL lookup
- `widget-snapshot.json` read/write
- atomic write
- schema version preflight
- golden fixture decode tests

Forbidden:

- provider API calls
- Keychain item CRUD
- account onboarding UI

### MenuBarApp

Allowed responsibilities:

- onboarding
- account settings
- CredentialStore usage
- collector scheduling
- SnapshotStore writer calls
- WidgetCenter timeline reload requests

Forbidden:

- storing raw provider response by default
- writing secrets to App Group

### WidgetExtension

Allowed responsibilities:

- read `widget-snapshot.json`
- decode `WidgetSnapshotDTO`
- render WidgetKit timelines
- show missing/corrupt/unsupported snapshot states

Forbidden:

- Keychain access
- ProviderAdapters import
- URLSession provider calls
- collector execution
- credential validation

## Allowed Imports

| Target/Module | May Import |
| --- | --- |
| `UsageCore` | Foundation |
| `ProviderAdapters` | Foundation |
| `SnapshotStore` | Foundation, UsageCore |
| `MenuBarApp` | SwiftUI, AppKit, WidgetKit, UsageCore, ProviderAdapters, SnapshotStore |
| `WidgetExtension` | SwiftUI, WidgetKit, UsageCore, SnapshotStore |

## Import Tests

The macOS test harness should include a guard that fails if WidgetExtension imports ProviderAdapters.

Suggested check:

```bash
rg "import ProviderAdapters" macos/Widget && exit 1 || true
```

## Data Direction

```text
ProviderAdapters
-> UsageCore normalized DTOs
-> SnapshotStore write
-> App Group widget-snapshot.json
-> SnapshotStore read
-> WidgetExtension render
```

No reverse dependency is allowed.
