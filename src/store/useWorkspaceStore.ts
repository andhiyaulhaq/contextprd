import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Workspace, DomainCategory } from '../types/workspace';
import { blueprintToFileTree } from '../lib/templates/blueprints';
import { useConversationStore } from './useConversationStore';
import { FileNode } from '../types/workspace';

export interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string | null;

  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, category: DomainCategory) => string;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;
  setActiveFile: (workspaceId: string, fileId: string) => void;
  createFile: (workspaceId: string, name: string) => string;
  renameFile: (workspaceId: string, fileId: string, newName: string) => void;
  deleteFile: (workspaceId: string, fileId: string) => void;
  updateFileContent: (workspaceId: string, fileId: string, updatedContent: string) => void;
}

const updateNode = (nodes: FileNode[], fileId: string, content: string): FileNode[] =>
  nodes.map((node) => {
    if (node.id === fileId) return { ...node, content };
    if (node.children) return { ...node, children: updateNode(node.children, fileId, content) };
    return node;
  });

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    temporal(
      (set) => ({
        workspaces: {},
        activeWorkspaceId: null,

        setActiveWorkspace: (id) => {
          set({ activeWorkspaceId: id });
          const convStore = useConversationStore.getState();
          const convs = convStore.getConversationsForWorkspace(id);
          if (convs.length > 0) {
            convStore.switchConversation(convs[0].id);
          }
        },

        createWorkspace: (name, category) => {
          const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const fileTree = blueprintToFileTree(category);

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
          };

          set((state) => ({
            workspaces: { ...state.workspaces, [id]: workspace },
            activeWorkspaceId: id,
          }));

          // Create default conversation in conversation store
          useConversationStore.getState().createConversation(id, 'Conversation 1');

          return id;
        },

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

        deleteWorkspace: (id) => {
          let nextId: string | null = null;
          
          set((state) => {
            const { [id]: _removed, ...remaining } = state.workspaces;
            const remainingIds = Object.keys(remaining);
            nextId = state.activeWorkspaceId === id ? remainingIds[0] || null : state.activeWorkspaceId;
            return {
              workspaces: remaining,
              activeWorkspaceId: nextId,
            };
          });

          // Clean up conversations AFTER state update to avoid intermediate inconsistent reads
          const convStore = useConversationStore.getState();
          convStore.deleteConversationsForWorkspace(id);

          if (nextId) {
            const convs = convStore.getConversationsForWorkspace(nextId);
            if (convs.length > 0) {
              convStore.switchConversation(convs[0].id);
            }
          }
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

        createFile: (workspaceId, name) => {
          let newId = '';
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            const newFile: FileNode = {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name,
              type: 'file',
              content: `# ${name.replace(/\.md$/i, '')}\n\n`,
            };
            newId = newFile.id;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  fileTree: [...workspace.fileTree, newFile],
                  activeFileId: newFile.id,
                },
              },
            };
          });
          return newId;
        },

        renameFile: (workspaceId, fileId, newName) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            
            const renameNode = (nodes: FileNode[]): FileNode[] =>
              nodes.map((node) => {
                if (node.id === fileId) return { ...node, name: newName };
                if (node.children) return { ...node, children: renameNode(node.children) };
                return node;
              });

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  fileTree: renameNode(workspace.fileTree),
                },
              },
            };
          }),

        deleteFile: (workspaceId, fileId) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            
            const deleteNode = (nodes: FileNode[]): FileNode[] =>
              nodes.filter(node => node.id !== fileId)
                   .map(node => node.children ? { ...node, children: deleteNode(node.children) } : node);

            const newFileTree = deleteNode(workspace.fileTree);
            // If the active file is deleted, try to select another file if possible
            let newActiveFileId = workspace.activeFileId;
            if (workspace.activeFileId === fileId) {
              const findFirstFile = (nodes: FileNode[]): string | null => {
                for (const node of nodes) {
                  if (node.type === 'file') return node.id;
                  if (node.children) {
                    const childFileId = findFirstFile(node.children);
                    if (childFileId) return childFileId;
                  }
                }
                return null;
              };
              newActiveFileId = findFirstFile(newFileTree);
            }

            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  fileTree: newFileTree,
                  activeFileId: newActiveFileId,
                },
              },
            };
          }),

        updateFileContent: (workspaceId, fileId, updatedContent) =>
          set((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return state;
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  fileTree: updateNode(workspace.fileTree, fileId, updatedContent),
                },
              },
            };
          }),
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

        // Migrate old data: strip conversations from workspace objects
        for (const [id, ws] of Object.entries(persisted?.workspaces || {})) {
          const rawWs = ws as any;

          // Migrate conversations to the conversation store if they exist in old format
          if (rawWs.conversations && Array.isArray(rawWs.conversations)) {
            const convStore = useConversationStore.getState();
            for (const conv of rawWs.conversations) {
              if (!convStore.conversations[conv.id]) {
                useConversationStore.setState((state) => ({
                  conversations: {
                    ...state.conversations,
                    [conv.id]: { ...conv, workspaceId: id },
                  },
                  activeConversationId: state.activeConversationId || conv.id,
                }));
              }
            }
          }

          // Strip conversation fields from workspace
          const { conversations: _c, activeConversationId: _a, chatMessages: _m, ...cleanWs } = rawWs;
          workspaces[id] = cleanWs as Workspace;
        }

        return {
          ...current,
          ...persisted,
          workspaces,
        };
      },
    }
  )
);
