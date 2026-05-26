# Inline AI Editor Architecture (Pattern 1)

This document details the architectural requirements and execution plan for transitioning ContextPRD's primary editor from a standard `<textarea>` to an advanced, rich-text engine capable of handling inline AI generation (`Cmd+K` pattern).

## 1. Engine Migration: CodeMirror 6

A standard HTML `<textarea>` does not support inline UI components, text decorations (like highlighted backgrounds), or multi-cursor ephemeral states. To support the "Inline Cmd+K" AI pattern, we must migrate the core editor engine.

**Selected Engine:** [CodeMirror 6](https://codemirror.net/)
- Excellent React integration via `@uiw/react-codemirror`
- Robust support for markdown syntax highlighting and auto-completion.
- Built-in `Decoration` API for rendering diff highlights (green additions, red deletions).
- `Widget` API for mounting React components (the Cmd+K input bar and the Accept/Reject popup) directly into the text flow.

## 2. Ephemeral "Draft" State Architecture

Currently, the `MarkdownEditor.tsx` component synchronizes local text state with the global `useWorkspaceStore` via a 300ms debounce. For inline AI generation, this creates a major problem: if the AI generates text that the user ultimately wants to reject, the text will have already been committed to the store and the `zundo` history stack.

### New State Flow:
1. **The Ghost String:** When the AI streams tokens, the tokens are appended to an isolated `draftString` state inside the editor component, NOT the main document state.
2. **Decoration Overlay:** CodeMirror uses a `ViewPlugin` to visually overlay this `draftString` at the cursor position with a distinct visual class (e.g., `bg-green-500/20 text-green-200`).
3. **Commit or Discard:** 
   - If the user clicks **Accept**, the `draftString` is merged into the true `localContent` state, and `updateFileContent` is called to commit to `useWorkspaceStore`.
   - If the user clicks **Reject**, the `draftString` is cleared, the decorations are removed, and the store remains untouched.

## 3. Cursor-Aware Prompt Compiler

The existing `compileContextPayload` sends the entire active document. For inline generation, the AI must understand *where* it is inserting text to maintain narrative and structural flow.

We will introduce a new context builder:

```typescript
export function compileInlineContext(
  content: string,
  cursorIndex: number,
  userQuery: string
) {
  const textBefore = content.substring(0, cursorIndex);
  const textAfter = content.substring(cursorIndex);
  
  return `
[DOCUMENT CONTEXT BEFORE CURSOR]
${textBefore}

<INSERTION_POINT>

[DOCUMENT CONTEXT AFTER CURSOR]
${textAfter}

INSTRUCTION: ${userQuery}
Generate the text that should be placed exactly at the <INSERTION_POINT>.
Return ONLY the raw markdown content to be inserted. Do not include introductory text.
  `.trim();
}
```

## 4. Interaction Flow & UI Widgets

The integration requires two specific CodeMirror widgets:

1. **The Cmd+K Input Widget:**
   - Triggered by `Cmd+K` (or a floating toolbar icon).
   - Appears exactly on the line of the cursor.
   - Contains a text input and a submit button.
   - Dispatches the query to the `useOpenRouterStream` hook.

2. **The Action Toolbar Widget:**
   - Appears at the bottom edge of the newly generated text block once the stream completes.
   - Buttons: `Accept`, `Reject`, and `Retry`.
   - Disappears upon selection, triggering the state merge/discard logic.

## 5. Fallback & Safe Degradation

If the application is offline or the OpenRouter API fails, the CodeMirror widgets must gracefully degrade:
- The Cmd+K input turns red and displays the `StreamError` string (e.g., "Network error" or "Rate limit exceeded").
- The draft state is instantly cleared so the user is not left with stuck decorations.
