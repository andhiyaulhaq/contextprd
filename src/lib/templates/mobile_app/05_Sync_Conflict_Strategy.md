# Mobile App: Sync Conflict Resolution

## Conflict Scenarios

| Scenario | Trigger | Detection Method |
|---|---|---|
| **Simultaneous Edit** | User edits document on mobile (offline) while teammate edits same doc on web | `updatedAt` server > `updatedAt` local at sync time |
| **Deleted Remote** | Document deleted on web while user has it open offline on mobile | Server returns `404` or delta marks doc as `deleted: true` |
| **Renamed Remote** | Document renamed on web while mobile has stale name | Name field differs between server delta and local record |
| **Workspace Deleted** | Workspace deleted on web while mobile has offline edits queued | Workspace not present in server sync response |

## Resolution Strategy

### Default: Last-Write-Wins (LWW)
*   Server clock is authoritative. `updatedAt` timestamps compared using ISO 8601 with millisecond precision.
*   If server `updatedAt` > local `updatedAt`: server version wins silently. Local changes discarded.
*   If local `updatedAt` > server `updatedAt` (offline edit made after last sync): local version pushed to server.

### Conflict Modal (Stale Conflicts Only)
Shown when: local `updatedAt` is > 1 hour behind server `updatedAt` AND local content differs.

```
┌────────────────────────────────────────┐
│  ⚠️  Sync Conflict: "ProjectSpec.md"   │
│                                        │
│  Your version: edited 2h ago           │
│  Server version: edited 35min ago      │
│                                        │
│  [ Keep My Version ]  [ Keep Server ]  │
│         [ View Differences ]           │
└────────────────────────────────────────┘
```

*   **Keep My Version:** Local content pushed to server, overwrites server version (creates a server version snapshot first).
*   **Keep Server:** Local changes discarded, server version pulled to local DB.
*   **View Differences:** Opens a unified diff view. User can manually cherry-pick sections before deciding.

## Deleted Remote Handling
*   If remote doc deleted and local has no unsaved changes: silently remove from local DB.
*   If remote doc deleted and local has queued changes: show alert "This document was deleted by {UserName}. Your unsaved changes will be lost." → "Discard" or "Save a Copy".

## Workspace Deleted Handling
*   All documents for that workspace removed from local DB after user acknowledges: "Workspace '{Name}' was deleted. {N} offline documents will be removed from this device."
*   If user had unsaved changes: offer "Export All as .zip" before deletion.