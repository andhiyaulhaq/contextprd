# Desktop App: Project Overview

## Core Objectives
*   **Mission:** Build a high-performance native desktop tool that operates entirely client-side with full native filesystem access — no cloud dependency required for core functionality.
*   **Target Platforms:** Windows 10/11 (x64 + ARM64), macOS Monterey 12.0+, Ubuntu 22.04 LTS+.
*   **Success Metrics:**
    *   Cold startup time < 1.5 seconds (from icon click to interactive UI)
    *   Idle memory footprint < 150MB RSS
    *   File read/render latency < 100ms for files up to 10MB
    *   Crash-free rate > 99.9% (measured via crash reporter telemetry)

## Architecture Paradigm
*   **Shell Engine:** Tauri v2 (Rust backend + WebView2/WebKit renderer, TypeScript frontend).
*   **Storage:** Local-first SQLite database via `sqlx` in Rust. No network required for any core feature.
*   **Process Model:** Main Rust process owns OS APIs + filesystem. Renderer process runs sandboxed UI. Communication strictly via Tauri IPC commands.
*   **Update Mechanism:** Tauri Updater plugin — checks for updates on launch, downloads in background, prompts user to restart.

## Constraints & Non-Goals
*   No browser-based access — desktop install required.
*   No real-time multi-user collaboration in v1 (file-based sync only).
*   32-bit OS targets not supported.