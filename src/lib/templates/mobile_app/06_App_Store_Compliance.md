# Mobile App: App Store Compliance

## Apple App Store Requirements

### Sign-In & Authentication
*   **Sign in with Apple** is mandatory when any other social login (Google, GitHub) is offered. Implemented via `expo-apple-authentication`.
*   Test credentials for Apple Review team documented in App Store Connect "Notes to Reviewer" field.

### Privacy & Data Practices
*   **Privacy Manifest (`PrivacyInfo.xcprivacy`):** Declares use of:
    *   `NSUserDefaults` (user preferences)
    *   `FileTimestamp` (document modification dates)
    *   `NSPrivacyAccessedAPICategoryUserDefaults` (MMKV storage)
*   **App Privacy Labels** in App Store Connect accurately reflect:
    *   Data collected: Account info (email, name), Usage data (feature events — anonymous)
    *   Data NOT collected: Precise location, Contacts, Browsing history, Financial info
*   **App Tracking Transparency (ATT):** Not required — no cross-app tracking or advertising.

### Entitlements
```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:app.yourapp.com</string>
</array>
<key>keychain-access-groups</key>
<array>
  <string>$(AppIdentifierPrefix)com.yourapp.app</string>
</array>
```

### Review Guidelines Compliance
*   No private API usage. Validated with `altool` static analysis before submission.
*   In-app purchases (if applicable) use StoreKit 2 — no external payment links in iOS build.
*   All user-generated content moderation policy documented in App Store Connect.

## Google Play Requirements

### Target SDK
*   `targetSdkVersion` maintained at latest required level (API 35+ from August 2025).
*   `compileSdkVersion` always matches `targetSdkVersion`.
*   `minSdkVersion`: 33 (Android 13).

### Runtime Permissions
All permissions requested at the point of use with an explanation modal before the system dialog:
| Permission | When Requested | Reason Shown to User |
|---|---|---|
| `POST_NOTIFICATIONS` | After onboarding | "Get notified when teammates update documents" |
| `CAMERA` | On avatar upload tap | "Take a profile photo" |
| `READ_MEDIA_IMAGES` | On avatar upload tap | "Choose a profile photo from your gallery" |
| `BIOMETRIC` | In Settings → Security | "Use fingerprint to unlock the app" |

### Play Data Safety
*   Data Safety form accurately reflects: account data collected, data encrypted in transit (TLS 1.3) and at rest (Android Keystore), user can request data deletion via Settings → Account → Delete Account.

### Internal Testing Track
*   CI auto-publishes to Internal Testing track on every merge to `main`.
*   Closed Testing (Beta) track requires manual promotion from Internal.