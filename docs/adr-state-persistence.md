# Architecture Decision Record: State Persistence Migration

## Status
Implemented ✅

## Context
The `ContextPRD` application currently leverages `zustand` for state management, specifically using the `persist` middleware to maintain state across page reloads. By default, this middleware utilizes the browser's synchronous `localStorage` API. 

The application stores heavy text payloads: Markdown file contents, chat message histories, and historical states via `zundo` (temporal time travel). `localStorage` has a strict hard limit of **5MB** per domain in modern browsers. 

## Decision
We must immediately migrate the storage engine from `localStorage` to **IndexedDB**. 

We will use a lightweight promise-based wrapper, such as `idb-keyval`, to interface with IndexedDB and pass it into the Zustand `persist` configuration as a custom storage engine.

## Consequences
### Positive
*   **Massive Storage Ceiling:** IndexedDB allows for gigabytes of storage (often up to 60%+ of the user's free disk space), entirely eliminating the 5MB crash risk.
*   **Performance:** IndexedDB operations are asynchronous and do not block the main UI thread, unlike `localStorage` which is synchronous and can cause micro-stutters when saving large state trees.

### Negative
*   **Asynchronous Hydration:** Because IndexedDB is asynchronous, the Zustand store will not be instantly hydrated on the first render. The application UI must be updated to handle a `hasHydrated` boolean state to prevent rendering "empty" screens or flashing unauthenticated states before the data loads.
