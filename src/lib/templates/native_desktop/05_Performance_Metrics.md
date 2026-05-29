# Desktop App: Performance Targets

## Benchmark Targets
| Operation | Target | Measurement Method |
|---|---|---|
| Cold startup → interactive UI | < 1.5s | Tauri `did-finish-load` event timing |
| File open & render (< 1MB) | < 50ms | Performance.now() around render call |
| File open & render (1–10MB) | < 100ms | Performance.now() around render call |
| Keypress → markdown preview update | < 16ms | requestAnimationFrame timing |
| Mermaid diagram parse + render | < 200ms | mermaid.parse() + mermaid.render() timing |
| SQLite write (save document) | < 10ms | sqlx query timing in Rust |
| Sidebar file tree render (500 files) | < 100ms | React DevTools profiler |
| App idle memory (RSS) | < 150MB | OS process monitor |
| App idle CPU | < 0.5% | OS process monitor |

## Profiling Strategy
*   **Frontend:** React DevTools Profiler for component render times. Chrome DevTools for memory + JS profiling (Tauri opens devtools in debug builds).
*   **Backend (Rust):** `cargo flamegraph` for CPU hotspots. `valgrind`/`heaptrack` for memory profiling on Linux.
*   **Startup:** Tauri `--release` build timing. Log timestamps at each init phase (DB open, store hydrate, first render).

## Memory Optimization Rules
1.  **Virtual Lists:** All file trees and long lists use `@tanstack/react-virtual`. Never render > 50 DOM nodes for lists.
2.  **Lazy Document Loading:** File content loaded into Zustand only when the document is opened — not at startup.
3.  **Webview Cleanup:** Unused background windows (`BrowserWindow`) are destroyed (not hidden) after 60s of inactivity.
4.  **Image/Asset Limits:** Max 5MB for any single in-app image. SVG preferred over PNG/JPG for icons and diagrams.

## Regression Prevention
*   **CI Benchmark:** Vitest bench runs startup simulation and render benchmarks on every PR. Fails if P95 exceeds target + 20%.
*   **Memory Snapshot Test:** Jest-based memory test compares heap snapshot before/after 100 file-open operations. Fails on > 5MB leak.