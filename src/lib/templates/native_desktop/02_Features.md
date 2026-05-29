# Desktop App: Core Native Features

## File System Integration
*   **Read/Write Access:** Full read/write to user-designated workspace directories via Tauri FS plugin.
*   **Native Dialogs:** OS-native file/folder pickers (`dialog::open`, `dialog::save`) — no custom UI required.
*   **File Watcher:** `notify` crate watches workspace directories. Changes made externally (e.g. in VS Code) trigger hot-reload in the app within 500ms.
*   **Drag & Drop:** Accepts files/folders dropped onto the application window. Folders are imported as new workspaces.

## Offline Mode
*   **Full Offline Capability:** 100% of core features work without internet. No feature degrades silently.
*   **AI Features (Online-Only):** AI chat requires network. When offline, input is disabled with a clear banner: "AI features require an internet connection."
*   **Conflict Resolution:** If a file is edited both inside and outside the app simultaneously, the app detects the mtime difference and presents a diff modal with "Keep Mine / Keep External / Merge" options.

## Application Shell Features
*   **Native Menu Bar:** File → New/Open/Save/Export; Edit → Undo/Redo/Cut/Copy/Paste; View → Toggle Sidebar/Zen Mode; Help → Check for Updates/About.
*   **System Tray:** Minimize to tray option. Right-click tray icon: Open, Recent Files, Quit.
*   **Window State Persistence:** Last window position, size, and sidebar state restored on next launch via SQLite config table.
*   **Multi-Window:** Open multiple documents in separate windows (Cmd+N).

## Auto-Update
*   **Check on Launch:** Silently checks GitHub Releases for newer version.
*   **Download in Background:** Downloads update package while user continues working.
*   **Install Prompt:** Non-blocking banner: "Update ready — restart to apply." User can defer indefinitely.
*   **Rollback:** Previous version installer preserved for 1 version. Accessible via Help → Roll Back.