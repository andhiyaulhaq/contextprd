# Mobile App: Native Mobile Features

## Touch & Gesture Design
*   **Touch Targets:** Minimum 48×48dp (Android) / 44×44pt (iOS) for all interactive elements — no exceptions.
*   **Gestures:**
    *   Swipe left on document row → Delete action (red reveal).
    *   Swipe right on document row → Pin/Favourite action.
    *   Pull-to-refresh on list screens → Triggers sync with server.
    *   Long press on document → Multi-select mode for bulk actions.
    *   Pinch-to-zoom in document preview.
*   **Haptic Feedback:** Light impact on button press, medium impact on destructive actions, success notif on sync complete.

## Authentication
*   **Login Methods:** Email + password, Google Sign-In, Apple Sign-In (required for iOS App Store).
*   **Biometrics:** Face ID (iOS) / Fingerprint (Android) as app lock after background — optional, off by default.
*   **Token Storage:** Access + refresh tokens stored in iOS Keychain / Android Keystore (never AsyncStorage).
*   **Auto-Logout:** After 30 days of inactivity or on server token revocation.

## Offline Capability
*   **Reads:** All workspace data (document list + content) served from local WatermelonDB. Zero network reads for browsing.
*   **Writes:** Mutations queued in `react-native-queue`. Queue persists across app restarts.
*   **Sync Trigger:** Auto-sync on app foreground + network reconnection. Manual pull-to-refresh available.
*   **Sync Indicator:** Persistent status bar: "Syncing…" / "Up to date ✓" / "Offline — changes queued (3)".

## Navigation Structure
```
Tab Bar:
  ├── Home (recent documents, activity feed)
  ├── Workspaces (list → document tree → editor)
  ├── Search (full-text search across all documents)
  └── Profile (settings, plan, logout)
```
*   Expo Router file-based routing. Deep link support: `yourapp://workspace/:id/document/:docId`.