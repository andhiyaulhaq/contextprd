# Desktop App: Performance Targets

## Benchmarks
*   **Frame Render Budget:** < 16.6ms (solid 60 FPS) under heavy layouts.
*   **File Read/Load:** < 100ms for loading files larger than 10MB.
*   **Local Search Indexing:** < 500ms for indexing 15,000 document files.

## Memory Optimization
*   Avoid memory leaks by terminating unused background webview instances.
*   Employ virtual list rendering for sidebar trees and active text views.