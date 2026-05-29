# Mobile App: Architecture & Sync

## Overall Architecture
```
React Native (Expo) UI
        ↓ (React Query)
WatermelonDB (local SQLite/LokiJS)
        ↓ (Sync Engine)
REST API (yourapp.com/api/v1)
        ↓
PostgreSQL (server-side source of truth)
```

## Sync Architecture

### Pull Sync (Server → Device)
1.  App sends `GET /api/v1/sync?since=<last_sync_timestamp>` on foreground.
2.  Server returns delta: created/updated/deleted records since that timestamp.
3.  WatermelonDB batch-applies the delta. `lastSyncedAt` updated atomically.

### Push Sync (Device → Server)
1.  Every local mutation writes to WatermelonDB + appends to the offline queue.
2.  Queue processes items FIFO when online. Each item: `{ operation, resourceType, payload, createdAt }`.
3.  On success: queue item removed. On 4xx: queue item marked failed, user notified. On 5xx: retried with backoff.

### Conflict Resolution
*   **Default:** Last-Write-Wins based on `updatedAt` timestamp (server clock authoritative).
*   **Conflict Modal:** Shown if local changes are > 1 hour older than server version. User chooses: Keep Local / Keep Server / View Diff.

## Data Persistence
| Data Type | Storage | Reason |
|---|---|---|
| Document content | WatermelonDB (SQLite) | Queryable, offline-first |
| Auth tokens | iOS Keychain / Android Keystore | Security |
| User preferences | MMKV (encrypted) | Fast synchronous reads |
| Media/images | FileSystem (Expo) | Binary blob storage |
| Offline queue | AsyncStorage (encrypted) | Persists across restarts |

## State Management
*   **Server state:** React Query v5 — cache, background refetch, optimistic updates.
*   **UI state:** Zustand (sidebar open, modal state, selected items).
*   **Navigation state:** Expo Router (URL-based, deep-linkable).