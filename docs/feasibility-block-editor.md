# Feasibility Study: Migration to Block-Based WYSIWYG Editor

**Document Type:** Architectural Feasibility Study  
**Author:** AI-assisted architectural analysis  
**Date:** 2026-05-26  
**Status:** Proposed  

---

## 1. Executive Summary

This study evaluates the feasibility of replacing the current dual-pane editor (CodeMirror raw text + MarkdownRenderer preview) with a **block-based, WYSIWYG editor** modeled after tools like Notion and Obsidian. The goal is to eliminate the cognitive overhead of maintaining two views and provide a richer, more intuitive writing experience where the active block reveals its raw syntax.

**Verdict: Feasible, with significant but manageable risk. Recommended migration path is Tiptap with a dual-storage strategy.**

---

## 2. Current Architecture Analysis

### 2.1 How It Works Today

The current editor (`src/components/editor/MarkdownEditor.tsx`) uses a **split-view architecture**:

```
┌─────────────────────────────────────────────┐
│  Toolbar  [Edit] [Split] [Preview]   words  │
├──────────────────┬──────────────────────────┤
│  CodeMirror      │  MarkdownRenderer        │
│  (raw markdown)  │  (remark/rehype HTML)    │
│                  │  (MermaidRenderer)       │
└──────────────────┴──────────────────────────┘
```

**Storage:** Raw markdown string stored directly in `FileNode.content` via `useProjectStore` → persisted in IndexedDB.

**AI Integration:**
- **Inline (Cmd+K):** `compileInlineContext()` generates a prompt using cursor position in CodeMirror's document. The AI response is streamed as raw text into the CodeMirror view with accept/reject highlights.
- **Chat context:** `compileContextPayload()` reads `file.content` as raw markdown and embeds it in the LLM system prompt.

### 2.2 Current Pain Points

| Problem | Impact |
|---|---|
| Two-pane split is required for live preview | Users lose 50% of screen space |
| Markdown syntax is exposed during writing | Cognitive overhead (`##`, `**`, `---`) |
| No draggable/reorderable blocks | PRD sections are hard to restructure |
| The `⌘K` Cmd+K cursor injection has fragile offset tracking | Low confidence in AI insertion accuracy |

---

## 3. Target Experience

The target is a **"click-to-edit" block experience**:

1. The document renders in full WYSIWYG by default (headings look like headings, bold looks bold, mermaid diagrams render inline).
2. Clicking on any block (a heading, a paragraph, a diagram) **activates it** and reveals its raw markdown or source syntax for that block only.
3. Editing is done directly in the rendered view — no separate code editor pane required.

This is exactly the UX model used by **Notion**, **Obsidian** (Live Preview mode), **Bear**, and **Craft Docs**.

---

## 4. Technology Evaluation

### 4.1 Candidate Libraries

#### Option A: BlockNote (`@blocknote/*`)
> Notion-style block editor built on Tiptap+ProseMirror

| Attribute | Assessment |
|---|---|
| **Block UX** | ✅ Native, drag-and-drop, slash commands (`/`) built-in |
| **Markdown Serialization** | ⚠️ Lossy — native format is JSON, not Markdown |
| **Mermaid Support** | ⚠️ Via community plugin `@defensestation/blocknote-mermaid` |
| **AI Integration** | ✅ `@blocknote/xl-ai` package with accept/reject flows |
| **Bundle Size** | ~160KB (gzipped) |
| **Setup Effort** | Low — highly opinionated, lots out of the box |
| **Risk** | ⚠️ Storage format conflict: migrating from raw `.md` storage to BlockNote JSON would break the entire export pipeline and the LLM prompt pipeline, which depend on raw markdown strings |

**Critical Issue:** BlockNote's native format is a JSON tree of block objects, not Markdown. Our entire AI system (`promptCompiler.ts`, `exportUtils.ts`) works on raw `FileNode.content` as a Markdown string. If we store JSON, we must convert to Markdown on every AI call and every export operation, introducing conversion latency and potential data loss.

---

#### Option B: Tiptap (`@tiptap/*`) ⭐ Recommended
> Headless rich-text framework built on ProseMirror

| Attribute | Assessment |
|---|---|
| **Block UX** | ✅ Fully customizable nodes, drag-and-drop via extension |
| **Markdown Serialization** | ✅ Via `@tiptap/extension-markdown` — lossless for standard GFM |
| **Mermaid Support** | ✅ Custom node extension (well-documented pattern) |
| **AI Integration** | ✅ Streaming text insertion via `chain().insertContent().run()`, accept/reject already doable |
| **Bundle Size** | ~60–90KB (tree-shakable) |
| **Setup Effort** | Medium — headless, you build your own toolbar and block UI |
| **Risk** | Medium — requires custom WYSIWYG block toolbar, but gives full control over storage format |

**Key Advantage:** Tiptap's `@tiptap/extension-markdown` extension allows the document to be **serialized to and from standard Markdown at any point**. We can keep storing raw `.md` in `FileNode.content` with zero pipeline changes, while providing a full WYSIWYG editing experience.

---

#### Option C: Build on ProseMirror directly
> Raw editor engine without framework abstractions

**Assessment:** Ruled out. ProseMirror requires significant infrastructure to replicate what Tiptap/BlockNote provide for free (collaborative cursors, block IDs, command menus). Estimated 4–6x development effort for equivalent features.

---

### 4.2 Recommendation: Tiptap

Tiptap is the optimal migration target because:
1. **Storage format is preserved.** The markdown string in `FileNode.content` remains the source of truth.
2. **AI pipeline is unchanged.** `promptCompiler.ts` still reads raw markdown from the store.
3. **Export pipeline is unchanged.** `exportUtils.ts` still reads raw markdown.
4. **The `@` context injection still works.** Files are matched by name in the input string.
5. **The Cmd+K inline generation can be significantly improved** — instead of fragile cursor offset tracking in CodeMirror, Tiptap's `chain()` API allows us to precisely insert content at cursor position as structured rich-text nodes.

---

## 5. Implementation Architecture (Tiptap)

### 5.1 Core Component Replacement

```
BEFORE                        AFTER
──────────────────────        ──────────────────────────────
MarkdownEditor.tsx            BlockEditor.tsx
│                             │
├── CodeMirror (raw)          ├── TiptapEditor (rich text)
│   └── draftHighlight        │   ├── MarkdownExtension (serializer)
│                             │   ├── StarterKit (all core nodes)
└── MarkdownRenderer.tsx      │   ├── MermaidNode (custom block)
    ├── remark                │   ├── DragHandleExtension
    ├── rehype                │   ├── BubbleMenu (hover toolbar)
    └── MermaidRenderer       │   └── SlashCommandExtension (/)
```

### 5.2 Storage Strategy (Dual Format)

To maintain compatibility with the rest of the system while providing a great WYSIWYG experience, we adopt a **dual-format strategy**:

```
┌─────────────────────────────────┐
│   FileNode.content  (raw .md)   │  ← Source of truth, stored in IndexedDB
└────────────────┬────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    On editor focus    On AI call / Export
         │                │
  Parse markdown      Read raw .md directly
  to Tiptap JSON       (no conversion needed)
         │
   Tiptap renders
   WYSIWYG view
         │
   User edits block
         │
   Serialize back to .md
         │
   Debounce → save to FileNode.content
```

This is identical to how Obsidian handles files — the on-disk format is always plain `.md`, and the WYSIWYG layer is a view transformation that is never persisted.

### 5.3 Custom Mermaid Node

The current `MermaidRenderer` component can be adapted into a Tiptap custom Node view:

```tsx
// In TiptapEditor: click to edit, renders diagram when not focused
const MermaidNode = Node.create({
  name: 'mermaid',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  
  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlockComponent);
  }
});
```

When the user clicks the rendered diagram, the block **transitions to a CodeMirror sub-editor** showing only the mermaid source. This is exactly how Notion handles code blocks and exactly the "real syntax for active block" UX requested.

### 5.4 Inline AI (Cmd+K) Improvement

The current Cmd+K implementation has fragile offset arithmetic. Tiptap's command API resolves this cleanly:

```ts
// On Cmd+K with AI response:
editor
  .chain()
  .focus()
  .insertContentAt(editor.state.selection, aiGeneratedNodes)
  .run();
```

**Accept/Reject flow** can be implemented with Tiptap's `Suggestion` extension or a custom mark (`ai-draft`) applied to inserted content, allowing a single `removeMark` call to strip the highlight on accept.

---

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **Markdown round-trip fidelity** — Tiptap's serializer may not preserve unusual markdown patterns (complex nested lists, raw HTML blocks) | Medium | Write regression tests against all 24 existing template files to validate round-trip. |
| **Mermaid live rendering** — Real-time Mermaid rendering on every keystroke is expensive | Medium | Debounce re-rendering by 600ms, only re-render on blur from the mermaid block. |
| **Bundle size increase** — Tiptap adds ~60–90KB gzipped vs. CodeMirror's ~80KB | Low | Both are similar in size. Using Tiptap extensions selectively can offset this. |
| **Tauri/Electron target** — If the app targets native via Tauri in the future, iframe-heavy WYSIWYG editors can be problematic | Low | Tiptap is a headless DOM editor with no iframes. No issue here. |
| **Learning curve** — Building custom toolbar/block UI is moderately complex | Low | BlockNote's UI can be referenced as a template. Alternatively, import `@tiptap/extension-bubble-menu` for a hover toolbar in ~2 hours. |
| **Cmd+K streaming into structured nodes** — Streaming raw markdown chunks into Tiptap's structured document model requires a staging textarea approach | Medium | Use a hidden `<textarea>` to accumulate the full streamed response, parse to Tiptap JSON only on `onComplete`, then insert. This avoids partial-parse errors during streaming. |

---

## 7. Migration Plan

### Phase 1: Foundation (Estimated: 2–3 days)
- [ ] Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-markdown`
- [ ] Create `BlockEditor.tsx` component as a **side-by-side alternative** to `MarkdownEditor.tsx` (no deletion yet)
- [ ] Validate markdown round-trip accuracy for all 24 template files
- [ ] Implement core toolbar: Bold, Italic, H1–H3, Code, Blockquote

### Phase 2: Block Features (Estimated: 3–4 days)
- [ ] Implement custom `MermaidNode` with CodeMirror sub-editor on focus
- [ ] Implement `DragHandle` extension for block drag-and-drop
- [ ] Implement `SlashCommand` extension (`/heading`, `/mermaid`, `/table`, etc.)
- [ ] Implement `BubbleMenu` for context-aware formatting toolbar

### Phase 3: AI Integration (Estimated: 2 days)
- [ ] Refactor `compileInlineContext` to generate instruction prompts that produce structured Tiptap-compatible markdown
- [ ] Implement streaming → staged accumulation → on-complete parse & insert pipeline for Cmd+K
- [ ] Implement `ai-draft` mark for accept/reject styling

### Phase 4: Cutover (Estimated: 1 day)
- [ ] Remove `MarkdownEditor.tsx` and `MarkdownRenderer.tsx`
- [ ] Remove `CodeMirror` dependency from `package.json`
- [ ] Update view mode toggle from `edit/split/preview` to a single toggle `source/rendered` (for power users who want raw markdown view)

**Total Estimated Effort: 8–10 working days**

---

## 8. Effort vs. Reward Summary

| Criteria | Score |
|---|---|
| **UX Improvement** | ⭐⭐⭐⭐⭐ — Elimination of split-view, professional feel |
| **Development Effort** | ⭐⭐⭐ — Significant, but well-defined phases |
| **Risk Level** | ⭐⭐ — Medium, fully mitigatable |
| **Long-term Maintainability** | ⭐⭐⭐⭐⭐ — Tiptap is industry standard, well-maintained |
| **AI Pipeline Disruption** | ⭐⭐⭐⭐⭐ — Zero pipeline impact with dual-format strategy |

---

## 9. Conclusion

**This migration is strongly recommended.** The dual-format strategy (Tiptap as the view layer, raw Markdown as the storage layer) cleanly solves every concern about breaking the AI pipeline or export features.

The **primary deliverable** — a block editor where clicking a heading or a Mermaid diagram reveals its syntax inline and editing happens directly on the rendered surface — is achievable with Tiptap's `ReactNodeViewRenderer` pattern in an estimated 10 working days.

This is the same pattern used by Obsidian's Live Preview mode, and it represents a significant leap forward in user experience for `ContextPRD`.

---

## 10. References
- [Tiptap Documentation](https://tiptap.dev)
- [BlockNote Documentation](https://www.blocknotejs.org)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [Tiptap Markdown Extension](https://github.com/aguingand/tiptap-markdown)
- [BlockNote Mermaid Plugin](https://github.com/defensestation/blocknote-mermaid)
