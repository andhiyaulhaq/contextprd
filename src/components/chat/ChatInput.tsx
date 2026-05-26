'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const deepAuditMode = useWorkspaceStore((s) => s.deepAuditMode);
  const setDeepAuditMode = useWorkspaceStore((s) => s.setDeepAuditMode);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 bg-gray-900/50">
      <div className="flex items-center gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => setDeepAuditMode(!deepAuditMode)}
          className={`text-xs px-2 py-1 rounded-md transition-all ${
            deepAuditMode
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-gray-600 hover:text-gray-400 border border-transparent'
          }`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Audit
          </span>
        </button>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? 'AI unavailable offline' : 'Ask AI to write, diagram, or audit...'}
          disabled={disabled}
          className="flex-1 bg-gray-800 text-gray-200 text-sm rounded-lg px-3.5 py-2.5 border border-gray-700 outline-none placeholder-gray-600 disabled:opacity-40 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-indigo-600 text-white text-sm rounded-lg px-4 py-2.5 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
          Send
        </button>
      </div>
    </form>
  );
};
