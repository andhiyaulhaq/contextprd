# Mobile App: Architecture & Sync

## Synchronization Architecture
*   Client maintains dynamic sync status (Syncing, Up-to-date, Offline, Sync Error).
*   API payload structures match JSON-patches to reduce mobile bandwidth payload sizes.

## Data Persistence
*   Structured data saved to SQLite.
*   Large markdown files saved to local sandboxed app document directory.
*   OAuth tokens stored securely via iOS Keychain / Android Keystore.