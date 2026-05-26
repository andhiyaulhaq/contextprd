# ContextPRD — Consolidated Specification

**Project:** Context-Aware PRD Orchestrator
**Codename:** ContextPRD
**Version:** 2.0.0 (Free-Tier Optimized)
**Target Audience:** Engineering, Product, and Design Teams

---

## 1. Executive Summary & Product Vision

### 1.1 Objective

ContextPRD is a high-performance desktop workspace tool built to streamline, standardize, and scale the lifecycle of Product Requirement Documents (PRDs). The application is uniform and platform-agnostic in its core engine, yet it adapts dynamically to support entirely separate, independent project categories (e.g., native desktop engines, cross-browser SaaS, mobile applications).

### 1.2 Core Value Proposition

- **Local-First Workspace Isolation:** Individual project workspaces, document hierarchies, and localized configurations live securely on the user's client machine to eliminate server data storage overhead.
- **Free-Tier Intelligence via OpenRouter:** All LLM interactions use free-tier OpenRouter models (e.g., Google Gemini Flash, Meta Llama-3). No premium model calls. A local NLP intent router maps each user request to the most appropriate free model.
- **Domain-Driven Guardrail Layer:** Translates the active workspace's target category directly into systemic constraints for the LLM. Switching workspaces shifts the chat agent's guidelines, evaluation schemas, and validation parameters instantly.

### 1.3 Target Audience

Engineering, Product, and Design teams writing structured PRDs across multiple project domains.

---

## 2. Technical Stack

| Layer | Technology | Purpose |
|---|---|---|
| Core Framework | Next.js 16 (App Router) | React component architecture with static export path |
| State Engine | Zustand + zundo (temporal middleware) + localStorage/IndexedDB persistence | UI config, workspace tree, chat history, undo/redo |
| Markdown Pipeline | unified, remark-parse, rehype-stringify | Safe local markdown processing and rendering |
| Diagram Rendering | mermaid (client-side, headless parse + SVG render) | Mermaid code block compilation |
| Native Wrapper | Tauri v2.0+ (Rust backend) | Desktop executable (.dmg / .msi / .deb) |
| AI SDK | Vercel AI SDK Core | Streaming OpenRouter API integration |
| Intent Classification | compromise.js (local NLP) | SKILL_ROUTER — zero-cost intent detection |
| Package Manager | pnpm | Fast, disk-efficient dependency management |

### 2.1 Build Configuration

- Next.js static export: `output: 'export'` in `next.config.js`
- Tauri dev: `pnpm dev` → `localhost:3000`
- Tauri build: `pnpm build` → Tauri bundles `frontendDist: ../out`
- Package install: `pnpm install`

### 2.2 Project Directory Structure

```
contextprd/
├── docs/
│   └── spec.md                          # Consolidated specification (this file)
├── src/
│   ├── app/                             # Next.js App Router pages
│   │   ├── layout.tsx                   # Root layout (triple-pane shell)
│   │   ├── page.tsx                     # Main workspace page
│   │   └── globals.css                  # Global styles
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── WorkspaceTree.tsx        # Left sidebar file/directory tree
│   │   │   └── WorkspaceSwitcher.tsx    # Workspace selector dropdown
│   │   ├── editor/
│   │   │   ├── MarkdownRenderer.tsx     # unified/remark MD → HTML renderer
│   │   │   ├── MermaidRenderer.tsx      # Client-side SVG render + parse validation
│   │   │   └── MarkdownEditor.tsx       # Text editing area
│   │   └── chat/
│   │       ├── ChatSidebar.tsx          # Right sidebar container
│   │       ├── ChatMessage.tsx          # Single message bubble
│   │       ├── ChatInput.tsx            # Input bar + Deep Audit toggle
│   │       └── CostTracker.tsx          # Advisory session cost display
│   ├── hooks/
│   │   ├── useUndoRedo.ts               # zundo undo/redo wrappers
│   │   ├── useSelfHealingOrchestrator.ts # Mermaid retry loop orchestrator
│   │   └── useOpenRouterStream.ts        # Vercel AI SDK streaming hook
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── router.ts                # Model registry (free-tier only)
│   │   │   ├── skillRouter.ts           # compromise.js intent classifier
│   │   │   └── promptCompiler.ts        # Context truncation + guardrail injector
│   │   └── templates/
│   │       └── blueprints.ts            # Hardcoded workspace template defaults
│   ├── store/
│   │   └── useWorkspaceStore.ts         # Zustand store (persist + temporal)
│   └── types/
│       └── workspace.ts                 # All TypeScript interfaces
├── public/
│   └── mermaid/                         # Bundled Mermaid.js lib (offline resilience)
├── src-tauri/                           # Tauri v2 Rust shell
│   ├── src/
│   │   ├── main.rs                      # Tauri entry point
│   │   └── lib.rs                       # Tauri app builder
│   ├── build.rs                         # Tauri build script
│   ├── Cargo.toml                       # Rust dependencies
│   ├── tauri.conf.json                  # Window, CSP, build config
│   ├── capabilities/
│   │   └── default.json                 # Permission capabilities
│   └── icons/                           # App icons (ico + png)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.js                       # output: 'export'
├── vitest.config.ts                     # Test runner config
└── .gitignore
```

---

## 3. System Architecture & UI Layout

### 3.1 Triple-Pane Layout

```
+------------------------------------------------------------------------+
|  LEFT SIDEBAR     |         MAIN CONTENT SECTION        | RIGHT SIDEBAR|
|                   |                                     |              |
| Workspace: Mobile | # 1. Push Notification Strategy    |  OPENROUTER  |
| ├─ Overview.md    |                                     |  SKILL CHAT  |
| ├─ Analytics.md   | The app must process deep links...  |  (Free Tier) |
| └─ Cache_Flow.md  | +---------------------------------+ | [User]:      |
|                   | |        MERMAID DIAGRAM          | | "Add a loop  |
|                   | |     (Client SVG Render)         | | for token    |
|                   | +---------------------------------+ | refresh"     |
+------------------------------------------------------------------------+
```

#### Left Sidebar: Isolated Workspace Tree
- Displays structural directories tied exclusively to the active workspace.
- Selecting a file locks the view context to that specific file path.
- Changing a workspace loads an isolated repository tree, flushing previous folder schemas from active component memory to prevent bleed.

#### Main Content Section: Live MD + Mermaid Viewport
- Compiles standard markdown elements and intercepts ````mermaid` blocks, processing text strings into responsive vector graphics (SVGs) natively on the client.

#### Right Sidebar: OpenRouter Chat
- LLM chat interface that runs streaming model threads.
- Wraps outgoing text strings with system prompt injections matching the active project's domain category.
- Runs a local intent classifier (compromise.js) to route requests to the best free model.

### 3.2 Data Flow Diagram

```
                                    +---------------------------------------+
                                    |        ContextPRD Local Runtime       |
                                    |                                       |
  +--------------------+            |  +---------------+  State Update      |
  |  Local Filesystem  | <==========>  | Zustand Store | ================>  |
  |  (Directories)     |            |  +-------+-------+                    |
  +--------------------+            |          |                            |
                                    |          | Read State                 |
                                    |          v                            |
                                    |  +---------------+                    |
                                    |  | Prompt Engine |                    |
                                    |  +-------+-------+                    |
                                    |          |                            |
                                    |          v                            |
                                    |  +---------------+  Intercept Stream  |
                                    |  | Vercel AI SDK | <===============+  |
                                    |  +-------+-------+                 |  |
                                    +----------|-------------------------|--+
                                               | Send Payload            |  |
                                               v                         |  |
                                    +--------------------+               |  |
                                    |  OpenRouter Edge   |               |  |
                                    +----------|---------+               |  |
                                               |                         |  |
                                               v                         |  |
                                    +--------------------+               |  |
                                    |  Free-Tier Models   |               |  |
                                    | (Gemini / Llama)    | ==============+--+
                                    +--------------------+  Token Stream
```

### 3.3 Core Execution Pipeline

1. **State Hydration:** On application boot, the workspace tree hydrates from localStorage into the Zustand store.
2. **Context Compilation:** When a thread execution request occurs, the application gathers the active document segment, attaches domain rules based on metadata parameters, and generates a structured schema payload.
3. **Intent Classification:** The payload passes through the local SKILL_ROUTER (compromise.js) to determine which free model endpoint to target.
4. **Stream Parsing & Interception:** The returned token stream maps directly into the markdown state engine. If code blocks are detected, the system passes them to the Mermaid validation layer before committing them to storage.

### 3.4 Tauri Desktop Assembly

```json
// src-tauri/tauri.conf.json
{
  "productName": "ContextPRD",
  "version": "2.0.0",
  "identifier": "com.contextprd.app",
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png"]
  },
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../out"
  },
  "app": {
    "windows": [{
      "title": "ContextPRD Workspace Client",
      "width": 1440,
      "height": 900,
      "resizable": true,
      "fullscreen": false
    }],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' https://openrouter.ai; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    }
  }
}
```

CSP allows `unsafe-eval` for Mermaid.js runtime compilation. External connections restricted to `https://openrouter.ai` only.

---

## 4. Core State Architecture

### 4.1 TypeScript Schema

```typescript
// types/workspace.ts

export type DomainCategory = 'WEB_APP' | 'NATIVE_DESKTOP' | 'MOBILE_APP' | 'GENERAL_SAAS';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'markdown' | 'directory';
  children?: FileNode[];
}

export interface DomainProfile {
  category: DomainCategory;
  systemGuardrails: string;
  templateBlueprint: Record<string, string>;
}

export interface Workspace {
  id: string;
  name: string;
  rootPath: string;
  profile: DomainProfile;
  fileTree: FileNode[];
  activeFileId: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  estimatedCost?: number;
}

export type SkillIntent = 'SKILL_WRITER' | 'SKILL_ARCHITECT' | 'SKILL_AUDITOR';
```

### 4.2 Zustand Store

```typescript
// store/useWorkspaceStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Workspace, FileNode, ChatMessage } from '../types/workspace';

interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string | null;
  sidebarOpen: boolean;
  sessionCost: number;          // advisory cost tracker (USD)
  deepAuditMode: boolean;      // toolbar toggle

  setActiveWorkspace: (id: string) => void;
  updateFileContent: (workspaceId: string, fileId: string, updatedContent: string) => void;
  addChatMessage: (workspaceId: string, message: ChatMessage) => void;
  setDeepAuditMode: (enabled: boolean) => void;
  addToSessionCost: (cost: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    temporal(
      (set) => ({
        workspaces: {},
        activeWorkspaceId: null,
        sidebarOpen: true,
        sessionCost: 0,
        deepAuditMode: false,

        setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

        updateFileContent: (workspaceId, fileId, updatedContent) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;

            const updateNode = (nodes: FileNode[]): FileNode[] =>
              nodes.map((node) => {
                if (node.id === fileId) return { ...node, content: updatedContent };
                if (node.children) return { ...node, children: updateNode(node.children) };
                return node;
              });

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  fileTree: updateNode(workspace.fileTree),
                },
              },
            };
          }),

        addChatMessage: (workspaceId, message) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  chatMessages: [...(workspace as any).chatMessages || [], message],
                },
              },
            };
          }),

        setDeepAuditMode: (enabled) => set({ deepAuditMode: enabled }),
        addToSessionCost: (cost) => set((state) => ({ sessionCost: state.sessionCost + cost })),
      }),
      {
        limit: 50,                    // cap history at 50 steps
        partialize: (state) => ({     // only track content mutations, not UI state
          workspaces: state.workspaces,
          activeWorkspaceId: state.activeWorkspaceId,
        }),
      }
    ),
    {
      name: 'context-prd-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 4.3 Workspace Sandbox Isolation

Switching workspaces triggers a full memory cleanup phase:

```typescript
setActiveWorkspace: (id) => {
  // 1. Flush active file reference
  // 2. Clear chat message buffer for previous workspace
  // 3. Reset session cost tracker
  // 4. Load new workspace tree from persisted store
  set({ activeWorkspaceId: id, sessionCost: 0 });
}
```

### 4.4 Undo/Redo via zundo

Wrapped via `zundo`'s `temporal` middleware, which snapshots state before each mutation. The companion temporal store is accessed via `useWorkspaceStore.temporal`.

```typescript
// hooks/useUndoRedo.ts
import { useStore } from 'zustand';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export function useUndoRedo() {
  const undo = useStore(useWorkspaceStore.temporal, (s) => s.undo);
  const redo = useStore(useWorkspaceStore.temporal, (s) => s.redo);
  const clear = useStore(useWorkspaceStore.temporal, (s) => s.clear);
  const canUndo = useStore(useWorkspaceStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useWorkspaceStore.temporal, (s) => s.futureStates.length > 0);

  return { undo, redo, clear, canUndo, canRedo };
}
```

**Keyboard bindings (global):**

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo last content mutation |
| `Ctrl+Shift+Z` | Redo last undone mutation |

**Scope:**
- **Tracked:** `workspaces` (file content, file tree mutations) and `activeWorkspaceId`
- **Excluded:** `sidebarOpen`, `sessionCost`, `deepAuditMode` (UI ephemera — no reason to undo these)
- **History cap:** 50 entries. Oldest entries are dropped first (FIFO).
- **Boundary:** History is scoped per-workspace session. Switching workspaces calls `clear()`. Page refresh preserves history via the parent `persist` middleware (history is serialized alongside store state into `localStorage`).

---

## 5. Intelligence Gateway (Free-Tier Only)

### 5.1 Model Registry

All models are free-tier. No premium fallback exists. The registry maps skill intents to model strings and records their cost per million tokens for advisory tracking.

```typescript
// lib/ai/router.ts
import { SkillIntent } from '../../types/workspace';

interface ModelRoute {
  modelId: string;
  costPerMillionInput: number;  // advisory, for cost tracker display
}

const MODEL_REGISTRY: Record<SkillIntent, ModelRoute> = {
  SKILL_WRITER: {
    modelId: 'google/gemini-flash-1.5:free',
    costPerMillionInput: 0.0,
  },
  SKILL_ARCHITECT: {
    modelId: 'meta-llama/llama-3-70b-instruct:free',
    costPerMillionInput: 0.0,
  },
  SKILL_AUDITOR: {
    modelId: 'google/gemini-flash-1.5:free',
    costPerMillionInput: 0.0,
  },
};

export function resolveModelEndpoint(skill: SkillIntent): ModelRoute {
  return MODEL_REGISTRY[skill];
}
```

### 5.2 SKILL_ROUTER — Local NLP Intent Classifier

Uses compromise.js for zero-cost, offline-capable intent detection. No API call is made for routing.

```typescript
// lib/ai/skillRouter.ts
import nlp from 'compromise';
import { SkillIntent } from '../../types/workspace';

interface ClassificationResult {
  intent: SkillIntent;
  confidence: number;
}

const INTENT_PATTERNS: Record<SkillIntent, string[]> = {
  SKILL_WRITER: [
    'write', 'expand', 'draft', 'rewrite', 'edit', 'prose',
    'narrative', 'describe', 'explain', 'section', 'paragraph',
  ],
  SKILL_ARCHITECT: [
    'diagram', 'flow', 'chart', 'mermaid', 'architecture',
    'layout', 'visualize', 'schema', 'structure', 'component',
  ],
  SKILL_AUDITOR: [
    'audit', 'compare', 'conflict', 'cross-project', 'review',
    'consistency', 'alignment', 'holistic', 'validate', 'check',
  ],
};

export function classifyIntent(userQuery: string): ClassificationResult {
  const doc = nlp(userQuery);
  const normalized = doc.text().toLowerCase();
  const words = new Set(normalized.split(/\s+/));

  const scores: Record<SkillIntent, number> = {
    SKILL_WRITER: 0,
    SKILL_ARCHITECT: 0,
    SKILL_AUDITOR: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        scores[intent as SkillIntent] += 1;
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted[0][1] === 0) {
    return { intent: 'SKILL_WRITER', confidence: 0 };  // default fallback
  }

  return {
    intent: sorted[0][0] as SkillIntent,
    confidence: sorted[0][1] / (sorted[0][1] + sorted[1][1]),
  };
}
```

**Routing rules:**
- Highest keyword match wins
- Tie → SKILL_WRITER (safest default)
- Zero keyword match → SKILL_WRITER with confidence 0
- Classifier runs synchronously, no network dependency

### 5.3 Prompt Compiler

Constructs the outbound prompt with domain guardrails, active file content, and system headers. Uses a sliding window — only the active file is sent, not the entire workspace.

```typescript
// lib/ai/promptCompiler.ts
import { Workspace, FileNode } from '../../types/workspace';

export interface SystemHeaders {
  workspaceName: string;
  domainCategory: string;
  activeFilePath: string;
  timestamp: number;
}

export function compileContextPayload(
  workspace: Workspace,
  activeFile: FileNode,
  userQuery: string,
  deepAudit: boolean = false,
): { prompt: string; headers: SystemHeaders } {

  const headers: SystemHeaders = {
    workspaceName: workspace.name,
    domainCategory: workspace.profile.category,
    activeFilePath: activeFile.path,
    timestamp: Date.now(),
  };

  const auditDirective = deepAudit
    ? `\n[DEEP AUDIT MODE] Perform a thorough cross-section analysis. Consider edge cases, platform constraints, and downstream impacts.`
    : '';

  const prompt = `
SYSTEM PROMPT CONSTRAINTS:
You are an expert software application architect. You must adhere strictly to the target environment's technical ecosystem constraints.
Target Category Context: ${workspace.profile.category}
Guardrail Assertions: ${workspace.profile.systemGuardrails}
${auditDirective}

ACTIVE FILE RECORD CONTENT UNDER EVALUATION:
\`\`\`markdown
File Path: ${activeFile.path}
${activeFile.content}
\`\`\`

USER OPERATIONAL INSTRUCTION:
${userQuery}

Return your changes cleanly. If diagrams are required, generate them entirely inside functional code markdown fences using standard syntax layout constructs (\`\`\`mermaid).
`.trim();

  return { prompt, headers };
}
```

### 5.4 Deep Audit Mode Toggle

A per-message toggle in the chat toolbar. When enabled, the prompt compiler appends the `[DEEP AUDIT MODE]` directive, which instructs the model to perform a more thorough analysis. The model used is the same free-tier model — no premium escalation occurs.

```typescript
// In chat toolbar component
<button
  onClick={() => store.setDeepAuditMode(!store.deepAuditMode)}
  data-active={store.deepAuditMode}
>
  {store.deepAuditMode ? 'Deep Audit: ON' : 'Deep Audit: OFF'}
</button>
```

---

## 6. Domain-Driven Guardrail Engine

### 6.1 Domain Categories

```typescript
export type DomainCategory = 'WEB_APP' | 'NATIVE_DESKTOP' | 'MOBILE_APP' | 'GENERAL_SAAS';
```

### 6.2 Profile-Based System Prompt Injection

Each workspace has a `DomainProfile` with a `systemGuardrails` string. When compiling a prompt, this string is injected into the system instructions sent to the model.

**Built-in guardrails:**

| Domain Category | System Guardrails |
|---|---|
| `WEB_APP` | Browser compatibility, responsive design, accessibility (WCAG), session management, CSP, CORS |
| `NATIVE_DESKTOP` | OS memory spaces, low latency, local file access permissions, threading model, IPC |
| `MOBILE_APP` | App Store rules, background sync, touch targets (44pt minimum), battery efficiency, offline-first |
| `GENERAL_SAAS` | Multi-tenancy, RBAC, API rate limits, data residency, webhook reliability |

### 6.3 Template Blueprints

When a new workspace is created, its `DomainProfile.templateBlueprint` is populated with hardcoded defaults. Users can then edit the generated files. Blueprints are key-value maps where keys are file paths and values are initial markdown content.

**Example blueprint for `MOBILE_APP`:**

```
/Overview.md          → "# Overview\n\n## Platform Requirements\n..."
/Analytics.md         → "# Analytics\n\n## Key Metrics\n..."
/Cache_Flow.md        → "# Caching Strategy\n\n## Offline Storage\n..."
/Push_Notifications.md → "# Push Notifications\n\n## Deep Linking\n..."
```

Hardcoded defaults live in `lib/templates/blueprints.ts` and are copied into the workspace on creation. Subsequent edits to the workspace files are independent of the template source.

---

## 7. Self-Healing Mermaid Engine

### 7.1 Headless Client-Side Validation

Before any Mermaid diagram is rendered or committed to state, it passes through a headless `mermaid.parse()` call. This runs synchronously in the browser — no server round-trip.

```typescript
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});
```

### 7.2 MermaidRenderer Component

```typescript
// components/editor/MermaidRenderer.tsx
interface MermaidRendererProps {
  chartDefinition: string;
  onSyntaxErrorDetected: (errorString: string) => void;
}
```

- Runs `mermaid.parse()` before rendering
- On success → renders SVG via `mermaid.render()`
- On parse failure → fires `onSyntaxErrorDetected` callback, shows red error banner

### 7.3 Error Recovery Loop

```
User requests diagram
       │
       v
Free model generates mermaid code
       │
       v
mermaid.parse() ── success ──> Render SVG
       │
     failure
       │
       v
Retry counter = 0 → increment to 1 → send repair prompt to SAME free model
       │
       v
mermaid.parse() ── success ──> Render SVG
       │
     failure
       │
       v
Show user-facing error: "Diagram generation failed. Please refine your request and try again."
```

**Repair prompt:**

```
Your previous output failed layout compilation validation checks.
Error Output Log: ${errorString}
Broken Code Chunk Sent:
\`\`\`mermaid
${brokenChartCode}
\`\`\`

Task: Fix the structural design layout definitions. Return ONLY the valid compiled code output block enclosed within appropriate markdown blocks.
```

### 7.4 Retry Budget & Dead-Letter State

- Maximum retry attempts per diagram generation: **1**
- Retry budget resets per user request (not per session)
- On dead-letter (both attempts failed), the broken code is discarded
- The UI shows a clean error frame with no stale diagram state
- The user can re-submit a refined request

---

## 8. Development Roadmap (12-Week Sprint Plan)

### Phase 1: Local-First Core Architecture (Weeks 1–3)

**Milestone:** A fully functional, ultra-low latency desktop workspace with multi-file markdown navigation and native client-side rendering.

#### Week 1: Monorepo Setup & Local Data Layer
- Initialize project with `pnpm create next-app` (Next.js 16 App Router, TypeScript) + `output: 'export'`
- Install dependencies: `pnpm add zustand zundo compromise.js unified remark-parse rehype-stringify mermaid ai @ai-sdk/openrouter`
- Install dev deps: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom`
- Set up Zustand store with persistence middleware (localStorage)
- Integrate zundo (`temporal`) middleware with 50-entry history cap, partialize (exclude UI ephemera), and per-workspace clear on switch
- Define TypeScript interfaces (Workspace, FileNode, DomainProfile, ChatMessage)
- Implement workspace sandbox — switching workspaces flushes state
- Initialize Tauri v2 shell with `pnpm create tauri-app`

#### Week 2: High-Performance Editor & Visual Engine
- Integrate unified/remark-parse/rehype-stringify parsing pipeline
- Build triple-pane structural shell layout (CSS Grid or Flexbox)
- Build markdown renderer that intercepts ````mermaid` fences
- Build MermaidRenderer component with headless validation
- Target: 50ms latency budget for keypress and file-switch rendering

#### Week 3: Tauri Native Desktop Bridge
- Install `@tauri-apps/cli@^2` and `@tauri-apps/api@^2`
- Create `src-tauri/` structure: `Cargo.toml`, `build.rs`, `src/main.rs`, `src/lib.rs`
- Create `tauri.conf.json` with window params (1440x900, resizable), CSP (`connect-src 'self' https://openrouter.ai`), and build commands using pnpm
- Create Tauri v2 capabilities file (`capabilities/default.json`) with core permissions
- Generate placeholder icons: `icon.ico`, `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`
- Add `"tauri": "tauri"` script to `package.json`
- Verify `cargo check` passes and `pnpm build` succeeds
- Test native window: title, dimensions, resize, fullscreen

### Phase 2: OpenRouter Integration & Free-Tier Controls (Weeks 4–6)

**Milestone:** A streaming conversational sidebar with local intent routing to the most appropriate free model.

#### Week 4: API Bridge & Stream Handlers
- Integrate Vercel AI SDK Core with OpenRouter streaming endpoint
- Build streaming response UI in right sidebar
- Implement resilient chunk-rendering (no main-thread jank)
- Handle connection errors and stream interruptions gracefully

#### Week 5: Local Skill Routing & Cost Tracker
- Implement SKILL_ROUTER using compromise.js
  - Intent patterns for WRITER, ARCHITECT, AUDITOR
  - Default fallback to WRITER on zero/low confidence
- Build advisory cost tracker component
  - Display per-message token count and estimated cost
  - Display cumulative session cost in sidebar footer
  - Show optimization tip when session cost exceeds $0.05

#### Week 6: Sliding Context Windows & Domain Profiles
- Build prompt compiler with context truncation
  - Send only active file + domain guardrails + system headers
  - Omit rest of workspace tree unless global audit requested
- Build domain profile injection modules
  - Read workspace profile on message send
  - Prepend category-specific guardrails to system prompt
- Implement Deep Audit Mode toggle (chat toolbar)

### Phase 3: Self-Healing Diagramming Engine (Weeks 7–9)

**Milestone:** Zero visual crashes. Invalid Mermaid syntax is caught client-side and auto-repaired once before showing an error.

#### Week 7: Headless Validation Interface
- Set up unrendered mermaid.parse() interceptor
- Intercept code string buffers before file state storage
- Capture and format raw exception strings

#### Week 8: Automatic Error-Correction Loop
- Build error recovery orchestrator (useSelfHealingOrchestrator)
- Implement retry budget (max 1 retry per request)
- Package invalid code block + error log → repair prompt → resend
- Dead-letter state: render clean error frame on final failure

#### Week 9: Deep Audit & Healing Polish
- Wire Deep Audit toggle to prompt compiler (thorough directive)
- Add visual indicators in chat (e.g., "Deep Audit: ON" badge)
- Polish error states for Mermaid failures
- Add loading/skeleton states for diagram generation

### Phase 4: System Hardening & Release (Weeks 10–12)

**Milestone:** Stable, optimized desktop build with offline capability and production-ready PRD output.

#### Week 10: Blueprint Automation & Local Search
- Build workspace creation wizard with domain selector
- Implement template blueprint copier (`lib/templates/blueprints.ts`)
- Add basic local file search (filename + content via Fuse.js or similar)

#### Week 11: Offline Hardening & Test Suite
- Network loss simulation tests
  - Verify file editing and navigation work offline
  - Verify AI chat disables input + shows banner
  - Verify Mermaid rendering works offline (cached)
- Write unit tests (Vitest):
  - Zustand store actions
  - Router: resolveModelEndpoint
  - Skill router: classifyIntent accuracy
  - Prompt compiler: context truncation, guardrail injection
- Write integration tests (React Testing Library):
  - Triple-pane layout rendering
  - MermaidRenderer: success and error states
  - Chat sidebar: streaming message display

#### Week 12: Production Compilations & Optimizations
- Memory profile analysis (Next.js runtime)
- Fix any leak vulnerabilities
- Compile target-specific distributions:
  - `.dmg` (macOS)
  - `.msi` (Windows)
  - `.deb` (Linux)
- Final code review and optimization pass

---

## 9. Non-Functional Requirements

### 9.1 Performance Budget

| Operation | Budget |
|---|---|
| Keypress → markdown re-render | ≤ 50ms |
| File switch → content display | ≤ 50ms |
| Mermaid parse + render | ≤ 200ms |
| Chat stream chunk render | ≤ 16ms (1 frame) |

### 9.2 Offline Resilience

| Feature | Online | Offline |
|---|---|---|
| File navigation | ✓ | ✓ |
| Markdown editing | ✓ | ✓ |
| File rename/delete | ✓ | ✓ |
| Mermaid rendering | ✓ | ✓ (cached lib) |
| AI Chat | ✓ | Input disabled, banner shown |
| Workspace creation | ✓ | ✓ (local only) |
| Template blueprint loading | ✓ | ✓ (hardcoded) |

### 9.3 Cost Controls

- All LLM interactions use free-tier OpenRouter models exclusively
- Advisory cost tracker displays per-message and session-level token cost estimates
- When a single conversational thread exceeds $0.05 in estimated cost, a non-blocking optimization tip is displayed
- No automated throttling or downgrades (since all calls are already free)
- Cost tracker resets per workspace session (workspace switch = reset)

### 9.4 Security

- CSP restricts connections to `self` + `https://openrouter.ai`
- Workspace isolation enforced at the store level — switching workspaces flushes active state
- No server-side data storage; all data lives on the local filesystem and localStorage
- Tauri native layer prevents arbitrary filesystem access beyond configured permissions

---

## Appendix: Clarified Decisions Log

| Question | Decision |
|---|---|
| SKILL_ROUTER implementation | Local NLP (compromise.js) — no API call for routing |
| Cost model | Free-tier only — premium models never called |
| Cost threshold behavior | Advisory tip only (auto-switch not needed since all free) |
| Template blueprint source | Hardcoded defaults + editable per-workspace |
| Premium fallback failure behavior | N/A (no premium fallback) — show error on 2nd failure |
| Offline chat UX | Disable input + show banner, preserve history |
| Testing approach | Unit (Vitest) + Integration (RTL) |
| Undo/Redo implementation | zundo temporal middleware, 50-entry cap, partialize content-only, keyboard Ctrl+Z / Ctrl+Shift+Z |
| Deep Audit Mode | Per-message toolbar toggle → thorough prompt, same free model |
| System headers | Workspace metadata only: name, category, file path, timestamp |
| Self-healing loop | Retry once on same free model → error on second failure |
| Workspace sandbox | Full store flush on switch: active file, chat buffer, session cost |
