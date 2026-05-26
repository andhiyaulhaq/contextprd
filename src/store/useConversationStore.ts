import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../lib/storage/idbStorage';
import { Conversation, ChatMessage } from '../types/project';

const MAX_CHAT_HISTORY = 100;

export interface ConversationState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  createConversation: (projectId: string, name?: string) => string;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, name: string) => void;
  deleteConversationsForProject: (projectId: string) => void;

  addChatMessage: (conversationId: string, message: ChatMessage) => void;
  updateChatMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteChatMessage: (conversationId: string, messageId: string) => void;
  clearChatMessages: (conversationId: string) => void;

  getConversationsForProject: (projectId: string) => Conversation[];
  getActiveConversation: () => Conversation | null;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      createConversation: (projectId, name) => {
        const now = Date.now();
        const convId = `conv-${now}-${Math.random().toString(36).slice(2, 6)}`;
        const existingCount = Object.values(get().conversations).filter(
          (c) => c.projectId === projectId
        ).length;

        const newConv: Conversation = {
          id: convId,
          projectId,
          name: name || `Conversation ${existingCount + 1}`,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversations: { ...state.conversations, [convId]: newConv },
          activeConversationId: convId,
        }));
        return convId;
      },

      switchConversation: (conversationId) => {
        const conv = get().conversations[conversationId];
        if (!conv) return;
        set({ activeConversationId: conversationId });
      },

      deleteConversation: (conversationId) => {
        const conv = get().conversations[conversationId];
        if (!conv) return;
        const projectId = conv.projectId;

        set((state) => {
          const { [conversationId]: _removed, ...remaining } = state.conversations;

          let nextActiveId = state.activeConversationId;

          if (state.activeConversationId === conversationId) {
            const wsConvs = Object.values(remaining).filter((c) => c.projectId === projectId);
            if (wsConvs.length > 0) {
              nextActiveId = wsConvs[0].id;
            } else {
              // Create fallback
              const now = Date.now();
              const fallbackId = `conv-${now}-${Math.random().toString(36).slice(2, 6)}`;
              remaining[fallbackId] = {
                id: fallbackId,
                projectId,
                name: 'Conversation 1',
                messages: [],
                createdAt: now,
                updatedAt: now,
              };
              nextActiveId = fallbackId;
            }
          }

          return {
            conversations: remaining,
            activeConversationId: nextActiveId,
          };
        });
      },

      renameConversation: (conversationId, name) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv) return state;
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: { ...conv, name },
            },
          };
        });
      },

      deleteConversationsForProject: (projectId) => {
        set((state) => {
          const remaining: Record<string, Conversation> = {};
          let activeStillExists = false;

          for (const [id, conv] of Object.entries(state.conversations)) {
            if (conv.projectId !== projectId) {
              remaining[id] = conv;
              if (id === state.activeConversationId) activeStillExists = true;
            }
          }

          return {
            conversations: remaining,
            activeConversationId: activeStillExists ? state.activeConversationId : null,
          };
        });
      },

      addChatMessage: (conversationId, message) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv) return state;
          let messages = [...conv.messages, message];
          if (messages.length > MAX_CHAT_HISTORY) {
            messages = messages.slice(-MAX_CHAT_HISTORY);
          }
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: { ...conv, messages, updatedAt: Date.now() },
            },
          };
        });
      },

      updateChatMessage: (conversationId, messageId, content) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv) return state;
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === messageId ? { ...m, content } : m
                ),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteChatMessage: (conversationId, messageId) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv) return state;
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conv,
                messages: conv.messages.filter((m) => m.id !== messageId),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      clearChatMessages: (conversationId) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv) return state;
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: { ...conv, messages: [], updatedAt: Date.now() },
            },
          };
        });
      },

      getConversationsForProject: (projectId) => {
        return Object.values(get().conversations)
          .filter((c) => c.projectId === projectId)
          .sort((a, b) => a.createdAt - b.createdAt);
      },

      getActiveConversation: () => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return null;
        return conversations[activeConversationId] || null;
      },
    }),
    {
      name: 'context-prd-conversations',
      storage: idbStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
