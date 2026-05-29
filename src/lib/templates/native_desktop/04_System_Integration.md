# Desktop App: OS Integration Spec

## Native Menu Bar
| Menu | Items |
|---|---|
| **File** | New Document (⌘N), Open Folder (⌘O), Save (⌘S), Export as PDF, Export as Markdown, Close Window (⌘W) |
| **Edit** | Undo (⌘Z), Redo (⌘⇧Z), Cut, Copy, Paste, Select All, Find (⌘F) |
| **View** | Toggle Sidebar (⌘B), Zen Mode (⌘⇧Z), Zoom In/Out/Reset, Toggle Dev Tools (debug builds only) |
| **Workspace** | New Workspace, Switch Workspace (submenu), Rename Workspace, Delete Workspace |
| **Help** | Documentation, Check for Updates, Report a Bug, About |

## System Tray
*   **Icon:** App icon in OS system tray (notification area on Windows, menu bar on macOS).
*   **Right-click context menu:** Open App, Recent Workspaces (last 5), Preferences, Quit.
*   **Minimize to Tray:** Optional setting. When enabled, closing window sends app to tray instead of quitting.

## File Associations
*   Register as default handler for `.cprd` (ContextPRD workspace bundles) on install.
*   `.md` association offered as optional (user prompted during first launch).
*   Drag a `.cprd` file onto the app icon (macOS Dock / Windows Taskbar) to open that workspace.

## Keyboard Shortcuts (Global)
| Shortcut | Action |
|---|---|
| `⌘N` | New document in active workspace |
| `⌘O` | Open folder as workspace |
| `⌘S` | Save current document |
| `⌘⇧E` | Export current document |
| `⌘B` | Toggle left sidebar |
| `⌘K` | Open command palette / AI prompt |
| `⌘Z` / `⌘⇧Z` | Undo / Redo (file content only) |
| `⌘,` | Open Preferences |
| `⌘W` | Close active window |
| `⌘Q` | Quit application |

## Crash Reporting & Telemetry
*   **Crash Reporter:** Tauri plugin captures unhandled Rust panics + JS errors. Sends report to Sentry (opt-in, asked on first launch).
*   **Telemetry:** Anonymous usage stats (feature usage frequency, startup time). No file contents or personal data ever sent. Opt-out available in Preferences → Privacy.
*   **Logs:** Rotating log file at `%APPDATA%/app/logs/` (Windows) or `~/Library/Logs/App/` (macOS). Max 10MB, 5 rotations.