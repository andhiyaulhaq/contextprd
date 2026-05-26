# Desktop App: Core Native Features

## File System Integration
*   **System Files:** Full read/write capability to designated workspace directories.
*   **Native Dialogs:** OS file pickers for choosing folder directories and opening archives.
*   **Watcher API:** Real-time hot-reloading when files are edited outside the application shell.

## Offline Mode Requirements
*   **Zero Network Sync:** Full functionality when disconnected.
*   **Conflict Resolution:** Local file system modifications override remote states.
*   **Local Engine:** Inline AI parsing via local llama.cpp endpoints when offline.