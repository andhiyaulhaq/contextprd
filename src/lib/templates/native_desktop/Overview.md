# Desktop App: Project Overview

## Core Objectives
*   **Mission:** Build a high-performance native desktop tool that operates client-side with native filesystem access.
*   **Target OS Platform:** Windows 10/11, macOS Monterey+, Ubuntu 22.04 LTS+.
*   **Success Metrics:** Idle memory < 150MB, App cold startup time < 1.5 seconds.

## Architecture Paradigm
*   **Shell Engine:** Tauri (Rust backend, HTML/TS frontend).
*   **Storage Approach:** Local-first SQLite database.
*   **Process Isolation:** Main native process handles OS APIs; Renderer process runs sandbox UI.