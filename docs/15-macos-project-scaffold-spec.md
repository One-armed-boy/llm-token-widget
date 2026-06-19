# macOS Project Scaffold Spec

작성일: 2026-06-19

## 목적

이 문서는 macOS/Xcode 환경에서 첫 native implementation을 만들 때의 프로젝트 골격을 고정합니다. 현재 Linux 환경에서는 Xcode build를 검증할 수 없으므로, Mac으로 이동한 뒤 이 문서를 기준으로 scaffold합니다.

## Product Targets

| Target | Type | 책임 |
| --- | --- | --- |
| `LLMTokenWidgetApp` | macOS App | menu bar app, account onboarding, collector trigger, Keychain access, App Group snapshot write |
| `LLMTokenWidgetExtension` | Widget Extension | App Group snapshot read, WidgetKit render only |
| `UsageCore` | Swift Package / Framework | DTO, recommendation display helpers, schema version constants |
| `ProviderAdapters` | Swift Package / Framework | OpenAI/Anthropic request planning, URLSession client, parser |
| `SnapshotStore` | Swift Package / Framework | atomic snapshot read/write, App Group path resolution |

## Test Targets

| Target | Type | 책임 |
| --- | --- | --- |
| `UsageCoreTests` | Unit Test | DTO decode, enum mapping, schemaVersion guard |
| `ProviderAdaptersTests` | Unit Test | sanitized fixture parser, error mapping |
| `SnapshotStoreTests` | Unit Test | golden snapshot decode, atomic write behavior |
| `LLMTokenWidgetUITests` | XCUITest | onboarding, account list, widget preview host |

## Bundle IDs

Initial local bundle IDs:

```text
app:    com.local.llm-token-widget
widget: com.local.llm-token-widget.widget
```

Before distribution, replace `com.local` with the Apple Developer Team domain.

## App Group

Initial App Group:

```text
group.com.local.llm-token-widget
```

App Group membership:

| Target | App Group |
| --- | --- |
| `LLMTokenWidgetApp` | yes |
| `LLMTokenWidgetExtension` | yes |
| `UsageCore` | no entitlement |
| `ProviderAdapters` | no entitlement |
| `SnapshotStore` | no entitlement itself; called by entitled targets |

## Minimum OS

Initial minimum target:

```text
macOS 14.0
```

Reasoning:

- WidgetKit on macOS is the main UI surface.
- Keeping the first target recent reduces compatibility work while the product contract is still changing.
- Lowering the target can be revisited after the first native vertical slice.

## Entitlements

`LLMTokenWidgetApp`:

- App Sandbox
- Outgoing Network Connections
- App Groups: `group.com.local.llm-token-widget`
- Keychain access group for app credentials

`LLMTokenWidgetExtension`:

- App Sandbox
- App Groups: `group.com.local.llm-token-widget`
- No Keychain access
- No network entitlement

## File Layout

```text
macos/
  LLMTokenWidget.xcodeproj
  App/
    LLMTokenWidgetApp.swift
    MenuBar/
    Onboarding/
    AccountSettings/
  Widget/
    LLMTokenWidgetBundle.swift
    LLMTokenWidget.swift
    WidgetViews/
  Packages/
    UsageCore/
    ProviderAdapters/
    SnapshotStore/
  Tests/
    Fixtures/
      widget-snapshot.golden.json
```

The golden fixture should be copied from:

```text
fixtures/snapshots/widget-snapshot.golden.json
```

## First Native Vertical Slice

The first Mac commit should do only this:

1. create Xcode project and targets
2. add Swift DTOs from [docs/14-swift-widget-contract.md](14-swift-widget-contract.md)
3. add golden snapshot decode unit test
4. render Widget preview from bundled golden snapshot
5. keep provider network execution and Keychain implementation stubbed

Do not start with live provider API calls in the native app.

## Completion Criteria

On macOS:

```bash
xcodebuild test -scheme LLMTokenWidgetApp
```

must at least verify:

- golden snapshot decodes
- unsupported schema version is rejected
- widget target compiles without ProviderAdapters import
- app target compiles with SnapshotStore and CredentialStore stubs
