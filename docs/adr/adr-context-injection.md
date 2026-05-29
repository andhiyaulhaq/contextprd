# Architecture Decision Record: Context Injection Strategy (@ File Mentions)

## Status
Proposed

## Context
In `ContextPRD`, users frequently need to ask the AI questions about specific files or combinations of files. Currently, the system relies on automatically injecting the "active file" or the entire workspace. However, users need a way to selectively and explicitly inject files into the LLM's context window without needing to open them all manually. 

Two primary approaches exist:
1. **Automated RAG (Retrieval-Augmented Generation):** Index the entire workspace locally into a Vector DB and let the LLM search for relevant snippets.
2. **Explicit Mentions (@ syntax):** Let the user explicitly tag files in the chat input to inject their full contents.

## Decision
We will implement the **Explicit Mentions (@ syntax)** approach. 

The implementation will consist of:
1. **UI Interception:** The `ChatInput` will detect the `@` symbol and render a floating combobox menu of available workspace files.
2. **State Tracking:** A React state (e.g., `Set<string>`) will securely track which file IDs have been mentioned to avoid string-parsing collisions.
3. **Prompt Compilation:** The `compileChatContext` function will intercept these IDs, fetch the raw `content` from `useWorkspaceStore`, and inject them as XML blocks (e.g., `<file path="...">...content...</file>`) directly into the system prompt.

## Consequences
### Positive
*   **High Accuracy:** The LLM receives the exact file the user wants, eliminating the "missed retrieval" problem common in RAG systems.
*   **Simple Implementation:** Does not require compiling or shipping heavy local Vector DB dependencies (like ONNX or local embedding models) to the browser.
*   **Zero Latency:** Fetching strings from the Zustand store is instantaneous.

### Negative
*   **Context Window Pressure:** If a user `@` mentions too many large files, they can easily exceed the model's token limits. We will need to implement a token-estimation UI warning to guide the user.
