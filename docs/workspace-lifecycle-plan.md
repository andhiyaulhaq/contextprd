# Implementation Plan: Workspace Create, Rename & Delete

## Goal

Add full workspace lifecycle management — the ability to **create**, **rename**, and **delete** workspaces — with a polished UI that replaces the current bare `<select>` dropdown with a proper workspace list panel.

## Current State

| Feature | Status | Location |
|---------|--------|----------|
| Create workspace | ✅ Exists | `WorkspaceSwitcher.tsx` (modal dialog) |
| Rename workspace | ❌ Missing | — |
| Delete workspace | ❌ Missing | — |
| Workspace selector | ⚠️ Basic `<select>` | `WorkspaceSwitcher.tsx` line 101-110 |

---

## Proposed Changes

### 1. Store: Add `renameWorkspace` and `deleteWorkspace` actions

#### [MODIFY] [useWorkspaceStore.ts](file:///d:/najib/3_resources/software-engineering/contextprd/src/store/useWorkspaceStore.ts)

**Add to the `WorkspaceState` interface:**

```typescript
renameWorkspace: (id: string, name: string) => void;
deleteWorkspace: (id: string) => void;
```

**Add action implementations:**

```typescript
renameWorkspace: (id, name) =>
  set((state) => {
    const workspace = state.workspaces[id];
    if (!workspace) return state;
    return {
      workspaces: {
        ...state.workspaces,
        [id]: { ...workspace, name },
      },
    };
  }),

deleteWorkspace: (id) =>
  set((state) => {
    const { [id]: removed, ...remaining } = state.workspaces;
    const remainingIds = Object.keys(remaining);
    return {
      workspaces: remaining,
      activeWorkspaceId:
        state.activeWorkspaceId === id
          ? remainingIds[0] || null
          : state.activeWorkspaceId,
    };
  }),
```

**Key behaviors:**
- `deleteWorkspace` removes the workspace from the `Record` and auto-switches to the next available workspace (or `null` if none remain)
- `renameWorkspace` updates the `name` field only, preserving all files and conversations

---

### 2. UI: Replace `<select>` with workspace list panel

#### [MODIFY] [WorkspaceSwitcher.tsx](file:///d:/najib/3_resources/software-engineering/contextprd/src/components/sidebar/WorkspaceSwitcher.tsx)

Replace the native `<select>` dropdown with a custom workspace list that supports:

**Workspace list items** — Each workspace row displays:
- Workspace name (truncated)
- Domain category badge (small colored pill: "Web App", "Desktop", etc.)
- Hover-reveal action buttons: ✏️ Rename, 🗑️ Delete

**Inline rename** — Clicking the rename button transforms the name into an editable `<input>`. Press `Enter` to confirm, `Escape` to cancel. Same pattern as `ConversationPicker.tsx`.

**Delete with confirmation** — First click turns the delete icon red with tooltip "Click again to confirm". Second click executes. Same double-click-to-confirm pattern used in `ConversationPicker.tsx` for consistency.

**Empty state** — When no workspaces exist, show a centered prompt: "Create your first workspace" with a prominent Create button.

**Visual design spec:**

```
┌─────────────────────────────────┐
│  📁 WORKSPACES            [+ ] │  ← Header + create button
├─────────────────────────────────┤
│  ● My SaaS Platform    ✏️ 🗑️  │  ← Active (indigo highlight)
│    Web App                      │  ← Category badge
├─────────────────────────────────┤
│  ○ Mobile Banking App   ✏️ 🗑️  │  ← Inactive
│    Mobile App                   │
├─────────────────────────────────┤
│  ○ Desktop Tool         ✏️ 🗑️  │
│    Desktop App                  │
└─────────────────────────────────┘
```

**Styling rules:**
- Active workspace: `bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500`
- Inactive workspace: `text-gray-400 hover:bg-gray-800/60`
- Action buttons: `opacity-0 group-hover:opacity-100` (reveal on hover)
- Category badge: `text-[10px] uppercase tracking-wider text-gray-500`
- Delete confirmation state: icon turns `text-rose-400`

---

### 3. Safety Guards

**Prevent delete while streaming:**
- If `streamingMessageId !== null` and the workspace being deleted is the active workspace, disable the delete button with a tooltip: "Cannot delete while AI is streaming"

**Prevent deleting last workspace:**
- This is allowed. When the last workspace is deleted, `activeWorkspaceId` becomes `null` and the UI shows the empty state

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/store/useWorkspaceStore.ts` | MODIFY | Add `renameWorkspace` and `deleteWorkspace` actions |
| `src/components/sidebar/WorkspaceSwitcher.tsx` | MODIFY | Replace `<select>` with workspace list, add rename/delete UI |

---

## Verification Plan

### Manual Testing
1. **Create** → Click "+", fill name and category, submit → workspace appears in list and becomes active
2. **Rename** → Hover workspace → click ✏️ → type new name → press Enter → name updates everywhere
3. **Rename cancel** → Press Escape during rename → name reverts
4. **Delete** → Hover → click 🗑️ (first click: turns red) → click again → workspace removed
5. **Delete active** → Delete the currently active workspace → app auto-switches to next workspace
6. **Delete last** → Delete all workspaces → app shows empty state
7. **Delete while streaming** → Start an AI chat → try to delete → button should be disabled
8. **Persistence** → Create/rename/delete → reload page → changes persist
