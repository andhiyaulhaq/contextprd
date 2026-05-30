import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

type Tab = 'account' | 'ai' | 'data';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    closeSettings, 
    userName, 
    setUserName, 
    theme, 
    setTheme, 
    openAIKey, 
    setOpenAIKey, 
    anthropicKey, 
    setAnthropicKey, 
    ollamaUrl, 
    setOllamaUrl 
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>('account');

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[85vh] md:h-[75vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={closeSettings}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Left Sidebar */}
        <div className="w-1/3 md:w-1/4 bg-gray-950/50 border-r border-gray-800 p-4 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Settings</div>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-gray-800 text-gray-200' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'}`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Account
          </button>
          
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-gray-800 text-gray-200' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'}`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AI Configuration
          </button>
          
          <button 
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-gray-800 text-gray-200' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'}`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            Data & Storage
          </button>
        </div>

        {/* Right Content Pane */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
          
          {activeTab === 'account' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-gray-800">My Account</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="Enter your name"
                  />
                  <p className="text-xs text-gray-500 mt-2">This is the name used in the sidebar avatar.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Appearance</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t as any)}
                        className={`py-2 px-3 rounded-md border text-sm font-medium capitalize transition-colors ${theme === t ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Light mode is coming in a future update.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-gray-800">AI Configuration</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Cloud Providers
                  </h3>
                  <div className="space-y-4 bg-gray-950/50 border border-gray-800 rounded-lg p-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">OpenAI API Key</label>
                      <input 
                        type="password" 
                        value={openAIKey}
                        onChange={(e) => setOpenAIKey(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="sk-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Anthropic API Key</label>
                      <input 
                        type="password" 
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="sk-ant-..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                    Local Inference
                  </h3>
                  <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-4">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Ollama Endpoint URL</label>
                    <input 
                      type="text" 
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="http://127.0.0.1:11434"
                    />
                    <p className="text-[11px] text-gray-500 mt-2">Ensure your Ollama instance is running with OLLAMA_ORIGINS="*" to allow browser requests.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-gray-800">Data & Storage</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-5">
                  <h3 className="text-sm font-medium text-gray-200 mb-1">Export Workspace</h3>
                  <p className="text-xs text-gray-500 mb-4">Download a ZIP file containing all your markdown blueprints and project architectures.</p>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-200 rounded-md transition-colors cursor-pointer">
                    Export to ZIP
                  </button>
                </div>

                <div className="bg-rose-950/10 border border-rose-900/50 rounded-lg p-5">
                  <h3 className="text-sm font-medium text-rose-400 mb-1">Danger Zone</h3>
                  <p className="text-xs text-gray-500 mb-4">Permanently delete all projects, files, and conversation history from this browser.</p>
                  <button 
                    onClick={() => {
                      if (confirm('Are you absolutely sure? This cannot be undone.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-medium rounded-md transition-colors cursor-pointer"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
