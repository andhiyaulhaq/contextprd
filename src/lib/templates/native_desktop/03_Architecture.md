# Desktop App: Multi-Process Architecture

## Process Communication (IPC)
*   Frontend triggers Rust bindings using secure commands: invoke('create_file', { path: string }).
*   Rust main process listens, executes system actions, and returns strongly-typed results.

## Data Schema & Local DB
*   **Engine:** SQLite (via sqlx in Rust).
*   **Migrations:** Embedded SQL scripts executed automatically on startup.
*   **Tables:** Workspaces, FileIndex, LocalConfig, ChatHistory.