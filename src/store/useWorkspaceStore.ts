import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Workspace, FileNode, ChatMessage, DomainCategory } from '../types/workspace';
import { blueprintToFileTree } from '../lib/templates/blueprints';

export interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string | null;
  sidebarOpen: boolean;
  sessionCost: number;
  deepAuditMode: boolean;

  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, category: DomainCategory) => string;
  setActiveFile: (workspaceId: string, fileId: string) => void;
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

        setActiveWorkspace: (id) => set({ activeWorkspaceId: id, sessionCost: 0 }),

        createWorkspace: (name, category) => {
          const id = `ws-${Date.now()}`;
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
            chatMessages: [],
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
            return {
              workspaces: {
                ...state.workspaces,
                [workspaceId]: {
                  ...workspace,
                  chatMessages: [...(workspace.chatMessages || []), message],
                },
              },
            };
          }),

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
    }
  )
);
