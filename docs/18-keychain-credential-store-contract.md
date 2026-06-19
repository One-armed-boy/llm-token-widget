# Keychain Credential Store Contract

작성일: 2026-06-19

## 목적

Provider credentials are stored in Keychain by the macOS app only. Widget extension must never receive Keychain entitlement or credential values.

## Protocol

```swift
protocol CredentialStore {
    func save(_ secret: ProviderSecret, for ref: CredentialRef) throws
    func load(_ ref: CredentialRef) throws -> ProviderSecret
    func delete(_ ref: CredentialRef) throws
}

struct CredentialRef: Codable, Hashable {
    let id: UUID
    let provider: ProviderDTO
    let accountId: String
}

struct ProviderSecret: Equatable {
    let value: String
}
```

## Implementations

| Implementation | Target | Use |
| --- | --- | --- |
| `KeychainCredentialStore` | app only | production credential storage |
| `InMemoryCredentialStore` | tests | unit/UI tests |
| `UnavailableCredentialStore` | widget | compile-time guard or explicit failure |

## Keychain Item Rules

- service: `com.local.llm-token-widget.credentials`
- account: `CredentialRef.id.uuidString`
- label: provider and display alias only
- value: raw API/admin key

Do not put secret fragments in:

- item label
- account alias
- logs
- App Group snapshot
- crash/debug reports

## Access Rules

`LLMTokenWidgetApp`:

- may save/load/delete credentials
- passes ephemeral secret value to ProviderAdapters
- redacts secret before logging any error

`LLMTokenWidgetExtension`:

- no Keychain entitlement
- no `CredentialStore.load`
- no provider credential validation

## Deletion Contract

When an account is deleted:

1. delete Keychain item
2. delete local account metadata
3. remove account from next widget snapshot
4. request WidgetKit timeline reload

## Error Handling

Credential load failures should map to account states:

| Error | Account State |
| --- | --- |
| missing item | `authFailed` |
| access denied | `authFailed` |
| malformed secret | `authFailed` |
| Keychain unavailable | `unknown` |

Never replace credential errors with zero usage.

## Test Requirements

macOS tests should verify:

- save/load/delete round trip with test namespace
- deleted account removes Keychain item
- widget target cannot import production Keychain store
- logs and snapshots do not contain secret values
