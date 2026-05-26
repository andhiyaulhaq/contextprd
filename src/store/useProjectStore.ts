import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../lib/storage/idbStorage';
import { temporal } from 'zundo';
import { Project, DomainCategory } from '../types/project';
import { blueprintToFileTree } from '../lib/templates/blueprints';
import { useConversationStore } from './useConversationStore';
import { FileNode } from '../types/project';

export interface ProjectState {
  projects: Record<string, Project>;
  activeProjectId: string | null;
  hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  setActiveProject: (id: string) => void;
  createProject: (name: string, category: DomainCategory) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setActiveFile: (projectId: string, fileId: string) => void;
  createFile: (projectId: string, name: string) => string;
  renameFile: (projectId: string, fileId: string, newName: string) => void;
  deleteFile: (projectId: string, fileId: string) => void;
  updateFileContent: (projectId: string, fileId: string, updatedContent: string) => void;
}

const updateNode = (nodes: FileNode[], fileId: string, content: string): FileNode[] =>
  nodes.map((node) => {
    if (node.id === fileId) return { ...node, content };
    if (node.children) return { ...node, children: updateNode(node.children, fileId, content) };
    return node;
  });

export const useProjectStore = create<ProjectState>()(
  persist(
    temporal(
      (set) => ({
        projects: {},
        activeProjectId: null,
        hasHydrated: false,

        setHasHydrated: (state) => set({ hasHydrated: state }),

        setActiveProject: (id) => {
          set({ activeProjectId: id });
          const convStore = useConversationStore.getState();
          const convs = convStore.getConversationsForProject(id);
          if (convs.length > 0) {
            convStore.switchConversation(convs[0].id);
          }
        },

        createProject: (name, category) => {
          const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const fileTree = blueprintToFileTree(category);

          const project: Project = {
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
            projects: { ...state.projects, [id]: project },
            activeProjectId: id,
          }));

          // Create default conversation in conversation store
          useConversationStore.getState().createConversation(id, 'Conversation 1');

          return id;
        },

        renameProject: (id, name) =>
          set((state) => {
            const project = state.projects[id];
            if (!project) return state;
            return {
              projects: {
                ...state.projects,
                [id]: { ...project, name },
              },
            };
          }),

        deleteProject: (id) => {
          let nextId: string | null = null;
          
          set((state) => {
            const { [id]: _removed, ...remaining } = state.projects;
            const remainingIds = Object.keys(remaining);
            nextId = state.activeProjectId === id ? remainingIds[0] || null : state.activeProjectId;
            return {
              projects: remaining,
              activeProjectId: nextId,
            };
          });

          // Clean up conversations AFTER state update to avoid intermediate inconsistent reads
          const convStore = useConversationStore.getState();
          convStore.deleteConversationsForProject(id);

          if (nextId) {
            const convs = convStore.getConversationsForProject(nextId);
            if (convs.length > 0) {
              convStore.switchConversation(convs[0].id);
            }
          }
        },

        setActiveFile: (projectId, fileId) =>
          set((state) => {
            const project = state.projects[projectId];
            if (!project) return state;
            return {
              projects: {
                ...state.projects,
                [projectId]: { ...project, activeFileId: fileId },
              },
            };
          }),

        createFile: (projectId, name) => {
          let newId = '';
          set((state) => {
            const project = state.projects[projectId];
            if (!project) return state;
            const newFile: FileNode = {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name,
              path: `${project.rootPath}/${name}`,
              type: 'markdown',
              content: `# ${name.replace(/\.md$/i, '')}\n\n`,
            };
            newId = newFile.id;
            return {
              projects: {
                ...state.projects,
                [projectId]: {
                  ...project,
                  fileTree: [...project.fileTree, newFile],
                  activeFileId: newFile.id,
                },
              },
            };
          });
          return newId;
        },

        renameFile: (projectId, fileId, newName) =>
          set((state) => {
            const project = state.projects[projectId];
            if (!project) return state;
            
            const renameNode = (nodes: FileNode[]): FileNode[] =>
              nodes.map((node) => {
                if (node.id === fileId) {
                  return {
                    ...node,
                    name: newName,
                    path: node.path ? node.path.replace(/[^/]+$/, newName) : `${project.rootPath}/${newName}`
                  };
                }
                if (node.children) return { ...node, children: renameNode(node.children) };
                return node;
              });

            return {
              projects: {
                ...state.projects,
                [projectId]: {
                  ...project,
                  fileTree: renameNode(project.fileTree),
                },
              },
            };
          }),

        deleteFile: (projectId, fileId) =>
          set((state) => {
            const project = state.projects[projectId];
            if (!project) return state;
            
            const deleteNode = (nodes: FileNode[]): FileNode[] =>
              nodes.filter(node => node.id !== fileId)
                   .map(node => node.children ? { ...node, children: deleteNode(node.children) } : node);

            const newFileTree = deleteNode(project.fileTree);
            // If the active file is deleted, try to select another file if possible
            let newActiveFileId = project.activeFileId;
            if (project.activeFileId === fileId) {
              const findFirstFile = (nodes: FileNode[]): string | null => {
                for (const node of nodes) {
                  if (node.type === 'markdown') return node.id;
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
              projects: {
                ...state.projects,
                [projectId]: {
                  ...project,
                  fileTree: newFileTree,
                  activeFileId: newActiveFileId,
                },
              },
            };
          }),

        updateFileContent: (projectId, fileId, updatedContent) =>
          set((state) => {
            const project = state.projects[projectId];
            if (!project) return state;
            return {
              projects: {
                ...state.projects,
                [projectId]: {
                  ...project,
                  fileTree: updateNode(project.fileTree, fileId, updatedContent),
                },
              },
            };
          }),
      }),
      {
        limit: 50,
        partialize: (state) => ({
          projects: state.projects,
          activeProjectId: state.activeProjectId,
        }),
      }
    ),
    {
      name: 'context-prd-projects',
      storage: idbStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persisted: any, current: ProjectState) => {
        const projects: Record<string, Project> = {};

        // Migrate old data: strip conversations from project objects
        for (const [id, ws] of Object.entries(persisted?.projects || {})) {
          const rawWs = ws as any;

          // Migrate conversations to the conversation store if they exist in old format
          if (rawWs.conversations && Array.isArray(rawWs.conversations)) {
            const convStore = useConversationStore.getState();
            for (const conv of rawWs.conversations) {
              if (!convStore.conversations[conv.id]) {
                useConversationStore.setState((state) => ({
                  conversations: {
                    ...state.conversations,
                    [conv.id]: { ...conv, projectId: id },
                  },
                  activeConversationId: state.activeConversationId || conv.id,
                }));
              }
            }
          }

          // Strip conversation fields from project
          const { conversations: _c, activeConversationId: _a, chatMessages: _m, ...cleanWs } = rawWs;
          projects[id] = cleanWs as Project;
        }

        return {
          ...current,
          ...persisted,
          projects,
        };
      },
    }
  )
);
