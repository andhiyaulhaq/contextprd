import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  
  // User Profile
  userName: string;
  setUserName: (name: string) => void;
  
  // Appearance
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  
  // AI Config
  openAIKey: string;
  setOpenAIKey: (key: string) => void;
  anthropicKey: string;
  setAnthropicKey: (key: string) => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isSettingsOpen: false,
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      
      userName: 'Najib',
      setUserName: (name) => set({ userName: name }),
      
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      
      openAIKey: '',
      setOpenAIKey: (key) => set({ openAIKey: key }),
      
      anthropicKey: '',
      setAnthropicKey: (key) => set({ anthropicKey: key }),
      
      ollamaUrl: 'http://127.0.0.1:11434',
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
    }),
    {
      name: 'architect-settings-storage',
      // We don't want to persist the modal open state
      partialize: (state) => ({ 
        userName: state.userName,
        theme: state.theme,
        openAIKey: state.openAIKey,
        anthropicKey: state.anthropicKey,
        ollamaUrl: state.ollamaUrl
      }),
    }
  )
);
