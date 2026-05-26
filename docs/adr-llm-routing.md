# Architecture Decision Record: LLM Routing Strategy

## Status
Proposed

## Context
`ContextPRD` features multiple distinct AI touchpoints:
1.  **Sidebar Chat:** A multi-turn, highly contextual conversation requiring deep reasoning.
2.  **Inline Edit (Ctrl+K):** A fast, surgical operation meant to quickly modify text or code.
3.  **Auto-Completions / Audits:** Background tasks analyzing the workspace.

Using a single "flagship" model (e.g., GPT-4o or Gemini 1.5 Pro) for everything results in unacceptable latency for micro-edits and exorbitant API costs. Using a single "fast" model (e.g., Haiku or Flash) results in poor reasoning for deep architectural questions.

## Decision
We will implement an **Intelligent LLM Routing Strategy**. The application (`resolveModelEndpoints` logic) will dynamically select the appropriate model tier based on the UI action being performed:

1.  **Heavy Reasoning (Sidebar Chat, Full Audits):** Route to flagship models (e.g., `gemini-1.5-pro`, `claude-3.5-sonnet`). These models take longer to stream but provide the necessary depth for macro-context tasks.
2.  **Surgical Edits (Ctrl+K, Micro-Drafts):** Route to low-latency models (e.g., `gemini-1.5-flash`, `claude-3-haiku`). These models provide near-instantaneous Time-To-First-Token (TTFT), making the IDE feel snappy.
3.  **Local Fallbacks:** Support routing to local endpoints (e.g., `ollama`, `LM Studio`) for users who require absolute zero-network privacy.

## Consequences
### Positive
*   **Optimized UX:** Operations that are supposed to feel instantaneous actually will.
*   **Cost Efficiency:** Dramatically reduces token costs by offloading simple parsing/editing tasks to cheaper models.

### Negative
*   **Prompt Engineering Complexity:** Different model tiers respond differently to system prompts. We must maintain and test different prompt templates tailored to the capabilities of each specific model class.
