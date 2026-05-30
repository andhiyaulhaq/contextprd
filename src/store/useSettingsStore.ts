import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AvatarColor = 'indigo-purple' | 'emerald-teal' | 'rose-orange' | 'sky-blue' | 'amber-yellow' | 'violet-pink';
export type EditorWidth = 'normal' | 'wide' | 'full';
export type Theme = 'dark' | 'light' | 'system';
export type ModelChoice = '9router' | 'ollama' | 'openai' | 'anthropic';

export const AVATAR_GRADIENTS: Record<AvatarColor, string> = {
  'indigo-purple': 'from-indigo-500 to-purple-500',
  'emerald-teal':  'from-emerald-500 to-teal-500',
  'rose-orange':   'from-rose-500 to-orange-500',
  'sky-blue':      'from-sky-500 to-blue-600',
  'amber-yellow':  'from-amber-400 to-yellow-500',
  'violet-pink':   'from-violet-500 to-pink-500',
};

export const MODEL_LABELS: Record<ModelChoice, string> = {
  '9router':    '9Router (Auto)',
  'ollama':     'Ollama (Local)',
  'openai':     'OpenAI GPT-4o',
  'anthropic':  'Claude Sonnet',
};

export const MODEL_IDS: Record<ModelChoice, string> = {
  '9router':   '9router:free-combo',
  'ollama':    'ollama:default',
  'openai':    'openai:gpt-4o',
  'anthropic': 'anthropic:claude-sonnet-4-5',
};

interface SettingsState {
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Profile
  userName: string;
  setUserName: (name: string) => void;
  avatarColor: AvatarColor;
  setAvatarColor: (color: AvatarColor) => void;

  // Appearance
  theme: Theme;
  setTheme: (theme: Theme) => void;
  editorWidth: EditorWidth;
  setEditorWidth: (width: EditorWidth) => void;

  // AI Models (per-skill)
  modelForArchitect: ModelChoice;
  setModelForArchitect: (m: ModelChoice) => void;
  modelForWriter: ModelChoice;
  setModelForWriter: (m: ModelChoice) => void;
  modelForAuditor: ModelChoice;
  setModelForAuditor: (m: ModelChoice) => void;

  // API Keys
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
      avatarColor: 'indigo-purple',
      setAvatarColor: (avatarColor) => set({ avatarColor }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      editorWidth: 'normal',
      setEditorWidth: (editorWidth) => set({ editorWidth }),

      modelForArchitect: '9router',
      setModelForArchitect: (m) => set({ modelForArchitect: m }),
      modelForWriter: '9router',
      setModelForWriter: (m) => set({ modelForWriter: m }),
      modelForAuditor: '9router',
      setModelForAuditor: (m) => set({ modelForAuditor: m }),

      openAIKey: '',
      setOpenAIKey: (key) => set({ openAIKey: key }),
      anthropicKey: '',
      setAnthropicKey: (key) => set({ anthropicKey: key }),
      ollamaUrl: 'http://127.0.0.1:11434',
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
    }),
    {
      name: 'architect-settings-v2',
      partialize: (state) => ({
        userName: state.userName,
        avatarColor: state.avatarColor,
        theme: state.theme,
        editorWidth: state.editorWidth,
        modelForArchitect: state.modelForArchitect,
        modelForWriter: state.modelForWriter,
        modelForAuditor: state.modelForAuditor,
        openAIKey: state.openAIKey,
        anthropicKey: state.anthropicKey,
        ollamaUrl: state.ollamaUrl,
      }),
    }
  )
);
