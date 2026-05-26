import { create } from 'zustand';

export interface SessionState {
  streamingMessageId: string | null;
  sessionCost: number;
  deepAuditMode: boolean;
  sidebarOpen: boolean;

  setStreamingMessageId: (id: string | null) => void;
  setDeepAuditMode: (enabled: boolean) => void;
  addToSessionCost: (cost: number) => void;
  resetSessionCost: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  streamingMessageId: null,
  sessionCost: 0,
  deepAuditMode: false,
  sidebarOpen: true,

  setStreamingMessageId: (id) => set({ streamingMessageId: id }),
  setDeepAuditMode: (enabled) => set({ deepAuditMode: enabled }),
  addToSessionCost: (cost) => set((state) => ({ sessionCost: state.sessionCost + cost })),
  resetSessionCost: () => set({ sessionCost: 0 }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
