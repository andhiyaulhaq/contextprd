# Mobile App: Push Notifications & Deep Linking

## Push Notification Setup

### iOS (Apple Push Notification Service — APNs)
*   **Certificate:** APNs Auth Key (`.p8` format, team-scoped) stored securely in CI secrets.
*   **Expo:** Configured via `expo-notifications`. `experienceId` set in `app.json`.
*   **Permission Request:** Requested after user completes onboarding (not on first launch). Custom pre-permission modal explains value first.

### Android (Firebase Cloud Messaging — FCM)
*   **Config:** `google-services.json` placed in `android/app/` (gitignored, injected by CI).
*   **Expo:** `expo-notifications` handles FCM token registration automatically.

### Notification Categories & Payloads
| Event | Title | Body | Deep Link |
|---|---|---|---|
| Document updated by teammate | "📄 {DocName} updated" | "{UserName} made changes" | `yourapp://document/:id` |
| Sync error | "⚠️ Sync failed" | "Tap to retry syncing your changes" | `yourapp://sync-status` |
| Mention in comment | "💬 You were mentioned" | "{UserName}: {excerpt}" | `yourapp://document/:id#comment/:cId` |
| Weekly activity digest | "📊 Your week in review" | "{N} documents updated this week" | `yourapp://home` |

### Notification Preferences (In-App Settings)
*   Per-category toggles: Document Updates, Mentions, Sync Alerts, Digest.
*   Quiet Hours: User-defined time range (e.g. 10pm–8am) where only Mentions are delivered.

## Deep Linking

### URL Scheme
*   Custom scheme: `yourapp://` (for inter-app linking and testing).
*   Universal Links: `https://app.yourapp.com/*` (iOS) / App Links: `https://app.yourapp.com/*` (Android).

### Supported Routes
| Path | Screen |
|---|---|
| `/` | Home tab |
| `/workspace/:id` | Workspace document list |
| `/workspace/:id/document/:docId` | Document editor |
| `/sync-status` | Sync status modal |
| `/profile` | Profile & settings |
| `/auth/reset-password?token=:token` | Password reset screen |

### Handling
*   Expo Router handles all deep links automatically via its URL-based routing.
*   If app is not running: launches app, authenticates (if token valid), navigates to link target.
*   If unauthenticated: redirects to login screen, stores intended link, navigates after auth.