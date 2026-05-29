# Desktop App: Multi-Process Architecture

## Process Communication (IPC)

All frontend-to-backend communication uses Tauri's typed command system. No arbitrary shell execution is permitted.

```rust
// Rust: Define a command
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

// TypeScript: Invoke from frontend
const content = await invoke<string>('read_file', { path: '/workspace/doc.md' });
```

*   **Security:** All IPC commands explicitly allowlisted in `capabilities/default.json`. Unknown commands are rejected.
*   **Error Propagation:** Rust errors serialized as `{ code: string, message: string }` — never raw panics.

## Local Database (SQLite via sqlx)

```sql
-- Core tables
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  profile_json TEXT NOT NULL,  -- DomainProfile serialized
  created_at INTEGER NOT NULL
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

*   **Migrations:** Embedded SQL files in `migrations/` directory, applied automatically on startup via `sqlx::migrate!()`.
*   **Connection Pool:** Single-writer `SqlitePool` (pool_size=1 for SQLite WAL safety). Read queries use separate pool (pool_size=4).

## Frontend State Management
*   Zustand store hydrates from SQLite on app boot via IPC.
*   All mutations: optimistic update in Zustand → async IPC write → confirm or rollback on error.
*   zundo temporal middleware captures file content mutations for Ctrl+Z / Ctrl+Shift+Z undo.

## Performance Targets
| Operation | Budget |
|---|---|
| Cold startup (Tauri window visible) | < 1.5s |
| File open & render | < 100ms |
| Keypress → markdown re-render | < 16ms (60 FPS) |
| SQLite write (single document save) | < 10ms |
| File watcher event → UI update | < 500ms |