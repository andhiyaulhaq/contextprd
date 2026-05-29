# Architecture Decision Record: Local-First Architecture

## Status
Accepted

## Context
When designing `ContextPRD`, a fundamental decision had to be made regarding where user data (workspaces, files, chat histories) resides and how it is processed. Traditional web apps rely on a client-server model where all data is immediately shipped to a remote database (e.g., Postgres via a Node/Go backend).

## Decision
We have chosen a strict **Local-First Architecture**. 

The application is built as a highly capable Single Page Application (SPA). All application state, file systems, and histories live exclusively within the user's browser storage (IndexedDB/LocalStorage). The only outbound network requests made are strictly to external LLM APIs (e.g., Google Gemini, Anthropic) to process prompts.

## Consequences
### Positive
*   **Ultimate Privacy:** The user's proprietary PRDs, code, and ideas are never stored on our servers. This is a massive selling point for enterprise users.
*   **Zero Latency:** Because there is no database round-trip required to open a file, switch workspaces, or navigate the UI, the application feels instantaneously fast.
*   **Offline Capability:** The core application UI and file management can function entirely offline.
*   **Zero Server Costs:** We do not need to scale a massive database or backend infrastructure to host user data.

### Negative
*   **No Cross-Device Sync (Yet):** Users cannot seamlessly log in on their phone and see the workspace they created on their laptop. 
*   **Mitigation:** In the future, cross-device sync must be implemented using Local-First sync protocols (e.g., WebRTC + CRDTs like Yjs or Automerge) rather than falling back to a traditional centralized database.
