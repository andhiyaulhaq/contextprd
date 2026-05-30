import React, { useState, useEffect, useCallback } from 'react';
import {
  useSettingsStore,
  AVATAR_GRADIENTS,
  MODEL_LABELS,
  type AvatarColor,
  type ModelChoice,
  type EditorWidth,
} from '../store/useSettingsStore';

type Tab = 'profile' | 'appearance' | 'ai' | 'privacy';

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-semibold text-white mb-1">{children}</h2>
);

const SectionDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-500 mb-8">{children}</p>
);

const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div className="mb-2">
    <label className="block text-sm font-medium text-gray-300">{children}</label>
    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

const Divider = () => <hr className="border-gray-800 my-7" />;

// ─── API Key Input with show/hide + validation ─────────────────────────────

interface ApiKeyInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange, placeholder, prefix }) => {
  const [show, setShow] = useState(false);
  const isValid = !value || (prefix ? value.startsWith(prefix) : true);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-gray-950 border rounded-md px-3 py-2 pr-10 text-sm text-gray-200 focus:outline-none transition-colors font-mono ${
          !isValid
            ? 'border-rose-500/70 focus:border-rose-500'
            : value
            ? 'border-emerald-600/50 focus:border-emerald-500'
            : 'border-gray-700 focus:border-indigo-500'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
      {prefix && value && !isValid && (
        <p className="text-xs text-rose-400 mt-1">Must start with <code className="font-mono">{prefix}</code></p>
      )}
    </div>
  );
};

// ─── Connection test button ────────────────────────────────────────────────

type TestStatus = 'idle' | 'loading' | 'ok' | 'error';

const ConnectionTestButton: React.FC<{ url: string }> = ({ url }) => {
  const [status, setStatus] = useState<TestStatus>('idle');

  const test = async () => {
    setStatus('loading');
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={test}
        disabled={status === 'loading'}
        className="text-xs px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
      >
        {status === 'loading' ? 'Testing…' : 'Test Connection'}
      </button>
      {status === 'ok'    && <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/> Online</span>}
      {status === 'error' && <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium"><span className="w-2 h-2 rounded-full bg-rose-400"/> Unreachable</span>}
    </div>
  );
};

// ─── Model Picker row ─────────────────────────────────────────────────────

interface ModelPickerProps {
  label: string;
  hint: string;
  value: ModelChoice;
  onChange: (m: ModelChoice) => void;
}

const ModelPicker: React.FC<ModelPickerProps> = ({ label, hint, value, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-800/60 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-200">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ModelChoice)}
      className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
    >
      {(Object.keys(MODEL_LABELS) as ModelChoice[]).map((key) => (
        <option key={key} value={key}>{MODEL_LABELS[key]}</option>
      ))}
    </select>
  </div>
);

// ─── Danger Zone with type-to-confirm ─────────────────────────────────────

const DangerZone = () => {
  const [input, setInput] = useState('');
  const confirmed = input === 'DELETE';

  return (
    <div className="bg-rose-950/10 border border-rose-900/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-rose-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <h3 className="text-sm font-semibold text-rose-400">Danger Zone</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        This will permanently delete all projects, files, AI conversations, and settings from this browser. This action is <strong className="text-gray-300">irreversible</strong>.
      </p>
      <p className="text-xs text-gray-400 mb-2">
        Type <code className="font-mono bg-gray-800 px-1 py-0.5 rounded text-rose-300">DELETE</code> to confirm:
      </p>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type DELETE"
          className="bg-gray-950 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-rose-500 font-mono w-40"
        />
        <button
          disabled={!confirmed}
          onClick={() => {
            if (confirmed) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 enabled:active:scale-95"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
};

// ─── Tab content components ────────────────────────────────────────────────

const ProfileTab = () => {
  const { userName, setUserName, avatarColor, setAvatarColor } = useSettingsStore();
  const initials = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-lg">
      <SectionTitle>Profile</SectionTitle>
      <SectionDescription>Your personal identity within the workspace.</SectionDescription>

      <div className="flex items-center gap-5 mb-8 p-4 bg-gray-800/40 border border-gray-800 rounded-xl">
        <div className={`w-14 h-14 rounded-full bg-linear-to-tr ${AVATAR_GRADIENTS[avatarColor]} flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 uppercase`}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-200">{userName || 'No name set'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Displayed in the sidebar and on documents</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <FieldLabel hint="Shown in the sidebar avatar and document metadata.">Display Name</FieldLabel>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <FieldLabel hint="Accent color for your avatar.">Avatar Color</FieldLabel>
          <div className="flex gap-2.5 flex-wrap">
            {(Object.keys(AVATAR_GRADIENTS) as AvatarColor[]).map((key) => (
              <button
                key={key}
                onClick={() => setAvatarColor(key)}
                className={`w-8 h-8 rounded-full bg-linear-to-tr ${AVATAR_GRADIENTS[key]} transition-all cursor-pointer hover:scale-110 ${
                  avatarColor === key ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppearanceTab = () => {
  const { theme, setTheme, editorWidth, setEditorWidth } = useSettingsStore();

  const widthOptions: { value: EditorWidth; label: string; desc: string }[] = [
    { value: 'normal', label: 'Normal',    desc: 'Comfortable reading width (56rem)' },
    { value: 'wide',   label: 'Wide',      desc: 'Expanded canvas (72rem)' },
    { value: 'full',   label: 'Full',      desc: 'Edge-to-edge content' },
  ];

  return (
    <div className="max-w-lg">
      <SectionTitle>Appearance</SectionTitle>
      <SectionDescription>Customize the look and feel of the editor.</SectionDescription>

      <div className="space-y-7">
        <div>
          <FieldLabel>Theme</FieldLabel>
          <div className="grid grid-cols-3 gap-3">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-all cursor-pointer ${
                  theme === t
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 ring-1 ring-indigo-500/30'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {t === 'dark' ? '🌙 Dark' : t === 'light' ? '☀️ Light' : '💻 System'}
              </button>
            ))}
          </div>
          {theme !== 'dark' && (
            <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1.5">
              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              Light / System mode coming in a future update.
            </p>
          )}
        </div>

        <Divider />

        <div>
          <FieldLabel hint="Controls the maximum content width inside the text editors.">Editor Width</FieldLabel>
          <div className="space-y-2">
            {widthOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEditorWidth(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all cursor-pointer ${
                  editorWidth === opt.value
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs opacity-60">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AIModelsTab = () => {
  const {
    modelForArchitect, setModelForArchitect,
    modelForWriter, setModelForWriter,
    modelForAuditor, setModelForAuditor,
    openAIKey, setOpenAIKey,
    anthropicKey, setAnthropicKey,
    ollamaUrl, setOllamaUrl,
  } = useSettingsStore();

  return (
    <div className="max-w-lg">
      <SectionTitle>AI & Models</SectionTitle>
      <SectionDescription>Configure which models power each workflow task.</SectionDescription>

      <div className="space-y-8">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Model Routing</h3>
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl overflow-hidden px-4">
            <ModelPicker
              label="Blueprint Generator"
              hint="Used when seeding projects with templates (SKILL_ARCHITECT)"
              value={modelForArchitect}
              onChange={setModelForArchitect}
            />
            <ModelPicker
              label="Inline Writer"
              hint="Used by Cmd+K in the editors (SKILL_WRITER)"
              value={modelForWriter}
              onChange={setModelForWriter}
            />
            <ModelPicker
              label="Chat Assistant"
              hint="Powers the right-side chat panel (SKILL_AUDITOR)"
              value={modelForAuditor}
              onChange={setModelForAuditor}
            />
          </div>
        </div>

        <Divider />

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cloud API Keys</h3>
          <div className="space-y-4">
            <div>
              <FieldLabel>OpenAI API Key</FieldLabel>
              <ApiKeyInput value={openAIKey} onChange={setOpenAIKey} placeholder="sk-..." prefix="sk-" />
            </div>
            <div>
              <FieldLabel>Anthropic API Key</FieldLabel>
              <ApiKeyInput value={anthropicKey} onChange={setAnthropicKey} placeholder="sk-ant-..." prefix="sk-ant-" />
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Local Inference</h3>
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
            <FieldLabel hint="The base URL of your running Ollama instance.">Ollama Endpoint</FieldLabel>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              placeholder="http://127.0.0.1:11434"
            />
            <ConnectionTestButton url={ollamaUrl} />
            <p className="text-[11px] text-gray-600 mt-3">
              Run Ollama with <code className="font-mono bg-gray-800 px-1 rounded">OLLAMA_ORIGINS="*"</code> to enable browser access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrivacyTab = () => {
  const projects = Object.keys(JSON.parse(localStorage.getItem('architect-projects') ?? '{}')).length;

  return (
    <div className="max-w-lg">
      <SectionTitle>Privacy & Data</SectionTitle>
      <SectionDescription>Manage your local workspace data. All data is stored in this browser only.</SectionDescription>

      <div className="space-y-5">
        <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            Export Workspace
          </h3>
          <p className="text-xs text-gray-500 mb-4">Download a ZIP archive of all your projects and markdown blueprints.</p>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-200 rounded-lg transition-colors cursor-pointer active:scale-95 font-medium">
            Export to ZIP
          </button>
        </div>

        <DangerZone />
      </div>
    </div>
  );
};


// ─── Tab nav definition ────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  { id: 'appearance', label: 'Appearance', icon: <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg> },
  { id: 'ai', label: 'AI & Models', icon: <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
  { id: 'privacy', label: 'Privacy & Data', icon: <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> },
];

// ─── Main Modal ────────────────────────────────────────────────────────────

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, closeSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeSettings();
  }, [closeSettings]);

  useEffect(() => {
    if (isSettingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSettingsOpen, handleKeyDown]);

  if (!isSettingsOpen) return null;

  const tabContent: Record<Tab, React.ReactNode> = {
    profile:    <ProfileTab />,
    appearance: <AppearanceTab />,
    ai:         <AIModelsTab />,
    privacy:    <PrivacyTab />,
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
    >
      <div className="w-full max-w-4xl h-[85vh] md:h-[78vh] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Left Nav */}
        <div className="w-56 shrink-0 bg-gray-950/60 border-r border-gray-800 p-3 flex flex-col">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 pt-2 pb-3">Settings</div>
          <nav className="flex flex-col gap-0.5 flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="pt-3 border-t border-gray-800 px-3 pb-1">
            <p className="text-[10px] text-gray-600">Press <kbd className="font-mono bg-gray-800 px-1 py-0.5 rounded text-gray-500">Esc</kbd> to close</p>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Close button */}
          <button
            onClick={closeSettings}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors z-10 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div className="p-8 lg:p-10 pr-12 animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeTab}>
            {tabContent[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
};
