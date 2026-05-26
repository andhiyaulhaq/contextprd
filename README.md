# ContextPRD

**Context-Aware PRD Orchestrator** — A local-first desktop workspace for authoring, diagramming, and reviewing Product Requirement Documents with free-tier AI assistance.

Built with Next.js 16, Tauri v2, Tailwind CSS v4, and a local NLP intent router — no server, no premium API costs.

---

## Features

- **Triple-Pane Workspace** — File tree, live markdown editor, and AI chat in one window
- **Domain-Driven Guardrails** — Workspaces are typed (Web, Desktop, Mobile, SaaS); each injects category-specific constraints into AI prompts
- **Local NLP Intent Router** — Uses compromise.js to classify requests as writing, diagramming, or auditing — zero API cost for routing
- **Self-Healing Mermaid Engine** — Client-side diagram validation with one auto-retry before surfacing errors
- **Free-Tier AI Only** — OpenRouter free models (Gemini Flash, Llama-3). No premium fallback. Advisory cost tracker per session
- **Undo/Redo** — 50-step history via zundo temporal middleware, scoped per workspace
- **Markdown with Live Preview** — Split/Edit/Preview modes with syntax-highlighted rendering via unified/remark/rehype
- **Tauri Desktop App** — Ships as `.msi` / `.dmg` / `.deb`. CSP locked to `self` + `openrouter.ai`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| State | Zustand + zundo (temporal undo/redo) + localStorage persistence |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Markdown | unified, remark-parse, remark-gfm, remark-rehype, rehype-stringify |
| Diagrams | Mermaid.js (client-side parse + SVG render) |
| AI SDK | Vercel AI SDK Core (OpenRouter streaming) |
| Intent NLP | compromise.js (offline, zero-cost) |
| Desktop | Tauri v2 (Rust shell) |
| Testing | Vitest + React Testing Library |
| Package | pnpm |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ LEFT SIDEBAR      │ MAIN CONTENT           │ RIGHT SIDEBAR  │
│                    │                         │                │
│ Workspace: Mobile  │ # Overview              │  AI Chat       │
│ ├─ Overview.md     │                         │  ┌──────────┐ │
│ ├─ Auth_Flow.md    │ Platform Requirements   │  │ User msg  │ │
│ └─ API.md          │ - WCAG 2.1 AA           │  ├──────────┤ │
│                    │ - Responsive            │  │ Response  │ │
│                    │ ┌─────────────────┐     │  └──────────┘ │
│                    │ │ Mermaid Diagram  │     │ [Audit] [Send]│
│                    │ └─────────────────┘     │  Cost: $0.0000│
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User creates a workspace** — picks a domain category, blueprint files are generated from templates
2. **Edits markdown** — content flows through Zustand → unified renderer → live preview
3. **Asks AI** — request goes through compass.js intent classifier → OpenRouter free model → streamed response
4. **Diagram fails** — MermaidRenderer catches it → orchestrator retries once → shows error or renders SVG

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Rust toolchain (for Tauri desktop build)

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Opens `http://localhost:3000` in the browser. The app is fully functional in the browser — the Tauri shell is only needed for desktop distribution.

### Desktop Build (Tauri)

```bash
pnpm build        # builds Next.js static export to ./out
pnpm tauri build  # bundles .msi / .dmg / .deb
```

### Tests

```bash
pnpm test         # vitest run
pnpm test:watch   # vitest watch mode
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (triple-pane)
│   ├── page.tsx                  # Main page
│   └── globals.css               # Tailwind v4 + custom styles
├── components/
│   ├── sidebar/
│   │   ├── WorkspaceSwitcher.tsx  # Workspace dropdown + create dialog
│   │   └── WorkspaceTree.tsx     # File tree with active selection
│   ├── editor/
│   │   ├── MarkdownEditor.tsx     # Edit / Split / Preview modes
│   │   ├── MarkdownRenderer.tsx   # unified markdown → HTML
│   │   └── MermaidRenderer.tsx    # Client-side SVG render
│   └── chat/
│       ├── ChatSidebar.tsx        # Chat container + orchestration
│       ├── ChatMessage.tsx        # Message bubble
│       ├── ChatInput.tsx          # Input + Deep Audit toggle
│       └── CostTracker.tsx        # Session cost display
├── hooks/
│   ├── useOpenRouterStream.ts     # Vercel AI SDK streaming
│   ├── useSelfHealingOrchestrator.ts  # Mermaid retry loop
│   └── useUndoRedo.ts             # zundo undo/redo wrappers
├── lib/
│   ├── ai/
│   │   ├── router.ts              # Free-tier model registry
│   │   ├── skillRouter.ts         # compromise.js intent classifier
│   │   └── promptCompiler.ts      # Context truncation + guardrails
│   └── templates/
│       └── blueprints.ts          # Domain-specific template files
├── store/
│   └── useWorkspaceStore.ts       # Zustand + zundo + persist
├── types/
│   └── workspace.ts               # TypeScript interfaces
└── test/
    ├── router.test.ts
    ├── skillRouter.test.ts
    ├── promptCompiler.test.ts
    └── setup.ts

src-tauri/                         # Tauri v2 desktop shell
├── src/main.rs                    # Entry point
├── src/lib.rs                     # App builder
├── Cargo.toml
├── tauri.conf.json                # Window, CSP, build config
├── capabilities/default.json      # Permission capabilities
└── icons/                         # App icons
```

---

## Core Concepts

### Workspaces

Each workspace has a **domain category** that determines its template blueprints and AI guardrails:

| Category | Template Files | Guardrails |
|---|---|---|
| `WEB_APP` | Overview, Auth Flow, API Endpoints | Browser compat, WCAG, CSP, CORS |
| `NATIVE_DESKTOP` | Overview, File System, Performance | OS memory, IPC, file permissions |
| `MOBILE_APP` | Overview, Push Notifications, Cache Flow | App Store rules, offline-first, battery |
| `GENERAL_SAAS` | Overview, Data Model, Integration | Multi-tenancy, RBAC, rate limits |

### AI Gateway

All LLM calls go through free-tier OpenRouter models. The local intent classifier (compromise.js) routes requests:

| Intent | Triggers | Model |
|---|---|---|
| `SKILL_WRITER` | write, draft, edit, expand | `google/gemini-flash-1.5:free` |
| `SKILL_ARCHITECT` | diagram, flow, mermaid, visualize | `meta-llama/llama-3-70b-instruct:free` |
| `SKILL_AUDITOR` | audit, review, validate, check | `google/gemini-flash-1.5:free` |

**Deep Audit Mode** — Toggle in the chat toolbar. Appends a thorough-analysis directive to the prompt (same free model, no premium escalation).

### Self-Healing Mermaid

1. Mermaid code is validated client-side with `mermaid.parse()`
2. On failure → one auto-retry with a repair prompt sent to the same free model
3. On second failure → clean error frame, diagram discarded

---

## Configuration

Set your OpenRouter API key in a `.env.local` file:

```
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
```

Without this key, the chat simulates responses so you can still test the UI and intent routing.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server (Turbopack) |
| `pnpm build` | Static export to `./out` |
| `pnpm start` | Serve static export |
| `pnpm test` | Run Vitest once |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm lint` | Next.js lint |
| `pnpm tauri` | Tauri CLI passthrough |
| `pnpm tauri dev` | Dev with Tauri shell |
| `pnpm tauri build` | Production desktop bundle |

---

## License

MIT
