import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Workspace, FileNode, ChatMessage, DomainCategory, Conversation } from '../types/workspace';
import { blueprintToFileTree } from '../lib/templates/blueprints';

const MAX_CHAT_HISTORY = 100;

export interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string | null;
  sidebarOpen: boolean;
  sessionCost: number;
  deepAuditMode: boolean;
  streamingMessageId: string | null;

  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, category: DomainCategory) => string;
  setActiveFile: (workspaceId: string, fileId: string) => void;
  updateFileContent: (workspaceId: string, fileId: string, updatedContent: string) => void;

  addChatMessage: (workspaceId: string, message: ChatMessage) => void;
  updateChatMessage: (workspaceId: string, messageId: string, content: string) => void;
  deleteChatMessage: (workspaceId: string, messageId: string) => void;
  clearChatMessages: (workspaceId: string) => void;

  createConversation: (workspaceId: string, name?: string) => string;
  switchConversation: (workspaceId: string, conversationId: string) => void;
  deleteConversation: (workspaceId: string, conversationId: string) => void;
  renameConversation: (workspaceId: string, conversationId: string, name: string) => void;

  setStreamingMessageId: (id: string | null) => void;
  setDeepAuditMode: (enabled: boolean) => void;
  addToSessionCost: (cost: number) => void;
}

function migrateWorkspace(ws: any): Workspace {
  if (ws.conversations) return ws as Workspace;
  const messages: ChatMessage[] = (ws as any).chatMessages || [];
  const now = Date.now();
  const firstConv: Conversation = {
    id: `conv-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Conversation 1',
    messages,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...ws,
    conversations: [firstConv],
    activeConversationId: firstConv.id,
  };
}

function getConversation(workspace: Workspace): Conversation | null {
  if (!workspace.activeConversationId) return null;
  return workspace.conversations.find((c) => c.id === workspace.activeConversationId) || null;
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
        streamingMessageId: null,

        setActiveWorkspace: (id) => set({ activeWorkspaceId: id, sessionCost: 0, streamingMessageId: null }),

        createWorkspace: (name, category) => {
          const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const fileTree = blueprintToFileTree(category);
          const now = Date.now();
          const firstConv: Conversation = {
            id: `conv-${now}-${Math.random().toString(36).slice(2, 6)}`,
            name: 'Conversation 1',
            messages: [],
            createdAt: now,
            updatedAt: now,
          };
          const workspace: Workspace = {
            id,
            name,
            rootPath: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
            profile: {
              category,
              systemGuardrails: `Domain: ${category}`,
              templateBlueprint: {},
            },
            fileTree,
            activeFileId: fileTree.length > 0 ? fileTree[0].id : null,
            conversations: [firstConv],
            activeConversationId: firstConv.id,
          };
          set((state) => ({
            workspaces: { ...state.workspaces, [id]: workspace },
            activeWorkspaceId: id,
            sessionCost: 0,
          }));
          return id;
        },

        setActiveFile: (workspaceId, fileId) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: { ...workspace, activeFileId: fileId },
              },
            };
          }),

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
            const conv = getConversation(workspace);
            if (!conv) return state;

            const messages = [...(conv.messages || []), message];

            if (messages.length > MAX_CHAT_HISTORY) {
              const streamingIdx = state.streamingMessageId
                ? messages.findIndex((m) => m.id === state.streamingMessageId)
                : -1;

              if (streamingIdx >= 0) {
                const keep = messages.slice(streamingIdx - Math.min(streamingIdx, 10));
                messages.splice(0, messages.length - keep.length, ...keep);
              } else {
                messages.splice(0, messages.length - MAX_CHAT_HISTORY);
              }
            }

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: workspace.conversations.map((c) =>
                    c.id === conv.id
                      ? { ...c, messages, updatedAt: Date.now() }
                      : c
                  ),
                },
              },
            };
          }),

        updateChatMessage: (workspaceId, messageId, content) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            const conv = getConversation(workspace);
            if (!conv) return state;

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: workspace.conversations.map((c) =>
                    c.id === conv.id
                      ? {
                          ...c,
                          messages: c.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, content } : msg
                          ),
                          updatedAt: Date.now(),
                        }
                      : c
                  ),
                },
              },
            };
          }),

        deleteChatMessage: (workspaceId, messageId) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            const conv = getConversation(workspace);
            if (!conv) return state;

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: workspace.conversations.map((c) =>
                    c.id === conv.id
                      ? {
                          ...c,
                          messages: c.messages.filter((m) => m.id !== messageId),
                          updatedAt: Date.now(),
                        }
                      : c
                  ),
                },
              },
            };
          }),

        clearChatMessages: (workspaceId) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            const conv = getConversation(workspace);
            if (!conv) return state;

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: workspace.conversations.map((c) =>
                    c.id === conv.id
                      ? { ...c, messages: [], updatedAt: Date.now() }
                      : c
                  ),
                },
              },
            };
          }),

        createConversation: (workspaceId, name) => {
          const now = Date.now();
          const convId = `conv-${now}-${Math.random().toString(36).slice(2, 6)}`;
          const newConv: Conversation = {
            id: convId,
            name: name || `Conversation ${now}`,
            messages: [],
            createdAt: now,
            updatedAt: now,
          };
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: [...workspace.conversations, newConv],
                  activeConversationId: convId,
                },
              },
            };
          });
          return convId;
        },

        switchConversation: (workspaceId, conversationId) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            const exists = workspace.conversations.some((c) => c.id === conversationId);
            if (!exists) return state;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  activeConversationId: conversationId,
                },
              },
            };
          }),

        deleteConversation: (workspaceId, conversationId) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            const remaining = workspace.conversations.filter((c) => c.id !== conversationId);
            if (remaining.length === 0) {
              const now = Date.now();
              const fallback: Conversation = {
                id: `conv-${now}-${Math.random().toString(36).slice(2, 6)}`,
                name: 'Conversation 1',
                messages: [],
                createdAt: now,
                updatedAt: now,
              };
              remaining.push(fallback);
            }
            const wasActive = workspace.activeConversationId === conversationId;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: remaining,
                  activeConversationId: wasActive ? remaining[0].id : workspace.activeConversationId,
                },
              },
            };
          }),

        renameConversation: (workspaceId, conversationId, name) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  conversations: workspace.conversations.map((c) =>
                    c.id === conversationId ? { ...c, name } : c
                  ),
                },
              },
            };
          }),

        setStreamingMessageId: (id) => set({ streamingMessageId: id }),

        setDeepAuditMode: (enabled) => set({ deepAuditMode: enabled }),
        addToSessionCost: (cost) => set((state) => ({ sessionCost: state.sessionCost + cost })),
      }),
      {
        limit: 50,
        partialize: (state) => ({
          workspaces: state.workspaces,
          activeWorkspaceId: state.activeWorkspaceId,
        }),
      }
    ),
    {
      name: 'context-prd-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted: any, current: WorkspaceState) => {
        const workspaces: Record<string, Workspace> = {};
        for (const [id, ws] of Object.entries(persisted.workspaces || {})) {
          workspaces[id] = migrateWorkspace(ws as any);
        }
        return { ...current, ...persisted, workspaces };
      },
    }
  )
);
