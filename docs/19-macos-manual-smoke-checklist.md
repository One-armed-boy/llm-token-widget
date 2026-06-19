# macOS Manual Smoke Checklist

작성일: 2026-06-19

## 목적

이 체크리스트는 macOS/Xcode 환경에서 자동화하기 어려운 첫 native vertical slice를 사람이 검증하기 위한 기준입니다.

## Preconditions

- Xcode installed
- Apple Developer Team selected or local signing enabled
- App Group id configured
- no real provider key required for the first smoke

## Build

```bash
xcodebuild -scheme LLMTokenWidgetApp -destination 'platform=macOS' build
```

Pass criteria:

- app target builds
- widget extension builds
- WidgetExtension does not import ProviderAdapters

## App Launch

Steps:

1. launch `LLMTokenWidgetApp`
2. confirm menu bar item appears
3. open menu bar popover
4. confirm sample/mock account state appears

Pass criteria:

- no crash
- no login prompt required for sample data
- copy uses "last updated" or "latest snapshot", not "real-time"

## Golden Snapshot Decode

Steps:

1. copy `fixtures/snapshots/widget-snapshot.golden.json` into App Group as `widget-snapshot.json`
2. launch app
3. open widget preview or widget host

Pass criteria:

- snapshot decodes
- best account is visible
- risky/stale/auth states are visually distinct
- missing metrics are not displayed as zero

## Widget Extension

Steps:

1. run widget extension target from Xcode
2. add widget to desktop or Notification Center when available
3. verify small/medium preview states

Pass criteria:

- widget appears in gallery
- widget renders from App Group snapshot
- widget does not require provider credentials
- widget does not perform network requests

## App Group Write

Steps:

1. trigger sample refresh in app
2. inspect App Group container
3. confirm `widget-snapshot.json` exists
4. run snapshot audit against copied file if exported into repo

Pass criteria:

- final snapshot is valid JSON
- no `.tmp` file remains after successful write
- widget updates after timeline reload

## Keychain

Steps:

1. add a fake test credential
2. validate it with mock/test mode
3. delete account
4. inspect Keychain item removal

Pass criteria:

- secret is not displayed after save
- secret is not written to App Group
- delete removes Keychain item and snapshot account entry

## Failure States

Manually verify:

- missing snapshot
- corrupt JSON
- unsupported schemaVersion
- auth failed account
- unsupported account
- stale account

Pass criteria:

- states are distinguishable
- no state triggers provider calls from widget
- no zero-usage fallback for errors

## Out Of Scope For First Smoke

- notarization
- App Store review
- real provider credential validation
- iCloud sync
- mobile widget
