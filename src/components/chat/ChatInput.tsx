'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { useProjectStore } from '../../store/useProjectStore';
import { FileNode } from '../../types/project';

interface ChatInputProps {
  onSend: (message: string, mentionedFileIds: string[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isStreaming, onStop, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const deepAuditMode = useSessionStore((s) => s.deepAuditMode);
  const setDeepAuditMode = useSessionStore((s) => s.setDeepAuditMode);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const project = activeProjectId ? projects[activeProjectId] : null;

  // Mentions State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionedFiles, setMentionedFiles] = useState<FileNode[]>([]);

  // Recursively flatten file tree to get all markdown files
  const allMarkdownFiles = useMemo(() => {
    if (!project) return [];
    const flatten = (nodes: FileNode[]): FileNode[] => {
      let files: FileNode[] = [];
      for (const node of nodes) {
        if (node.type === 'markdown') {
          files.push(node);
        }
        if (node.children) {
          files = files.concat(flatten(node.children));
        }
      }
      return files;
    };
    return flatten(project.fileTree);
  }, [project]);

  // Sync mentioned files state with text contents
  useEffect(() => {
    const present = allMarkdownFiles.filter((f) => input.includes(`@${f.name}`));
    setMentionedFiles(present);
  }, [input, allMarkdownFiles]);

  // Focus textarea when streaming completes
  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  // Filter suggestions based on search term
  const filteredSuggestions = useMemo(() => {
    if (!suggestionSearch) return allMarkdownFiles;
    return allMarkdownFiles.filter((f) =>
      f.name.toLowerCase().includes(suggestionSearch.toLowerCase())
    );
  }, [allMarkdownFiles, suggestionSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, selectionStart);
    
    // Check if we are currently typing a word that starts with '@'
    const match = textBeforeCursor.match(/@(\S*)$/);
    if (match) {
      setSuggestionSearch(match[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (file: FileNode) => {
    const selectionStart = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = input.substring(0, selectionStart);
    const textAfterCursor = input.substring(selectionStart);

    // Find the start of the '@' token
    const lastWordStart = textBeforeCursor.lastIndexOf('@');
    const updatedBefore = textBeforeCursor.substring(0, lastWordStart) + `@${file.name} `;

    setInput(updatedBefore + textAfterCursor);
    setShowSuggestions(false);

    // Refocus and place cursor after the inserted filename
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = updatedBefore.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const removeMention = (fileName: string) => {
    setInput((prev) => prev.replace(new RegExp(`@${fileName}\\s?`, 'g'), ''));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled || isStreaming) return;

    const fileIds = mentionedFiles.map((f) => f.id);
    onSend(input.trim(), fileIds);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectSuggestion(filteredSuggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Estimate tokens (chars / 4)
  const totalChars = mentionedFiles.reduce((acc, f) => acc + f.content.length, 0);
  const tokenEstimate = Math.ceil(totalChars / 4);
  const tokenLimitWarning = 60000;

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 bg-gray-900/50 relative">
      
      {/* Suggestions Popup */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 left-3 right-3 bg-gray-950 border border-gray-800 rounded-lg shadow-2xl z-50 overflow-y-auto max-h-48 flex flex-col py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-900 mb-1">
            Mention File Context
          </div>
          {filteredSuggestions.map((file, idx) => (
            <button
              key={file.id}
              type="button"
              onClick={() => selectSuggestion(file)}
              className={`px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                idx === selectedIndex ? 'bg-indigo-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-900'
              }`}
            >
              <span className="opacity-70">#</span>
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-[10px] opacity-50 shrink-0">{(file.content.length / 1024).toFixed(1)} KB</span>
            </button>
          ))}
        </div>
      )}

      {/* Warning/Pills Bar */}
      <div className="flex flex-col gap-2 mb-2">
        {/* Token warning */}
        {tokenEstimate > tokenLimitWarning && (
          <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Context size warning:</strong> Mentioned files total ~{tokenEstimate.toLocaleString()} tokens. Model responses may become slower or lose context.
            </span>
          </div>
        )}

        {/* Action triggers and Active Mention Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDeepAuditMode(!deepAuditMode)}
            className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-all active:scale-[0.98] ${
              deepAuditMode
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Audit
            </span>
          </button>

          {mentionedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium pl-2 pr-1 py-0.5 rounded-full"
            >
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeMention(file.name)}
                className="p-0.5 hover:text-white rounded-full hover:bg-indigo-500/20 cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Input Textarea & Send button */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'AI unavailable offline'
              : isStreaming
              ? 'AI is responding...'
              : 'Ask AI (type @ to tag files)...'
          }
          disabled={disabled || isStreaming}
          rows={Math.max(1, Math.min(6, input.split('\n').length))}
          className="flex-1 min-w-0 w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3.5 py-2 border border-gray-700 outline-none placeholder-gray-600 disabled:opacity-40 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none max-h-36 overflow-y-auto"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 bg-rose-600 text-white text-sm rounded-lg px-4 py-2 cursor-pointer hover:bg-rose-500 transition-all flex items-center gap-1.5 active:scale-[0.98] h-[38px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12v12H6z" />
            </svg>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="shrink-0 bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 cursor-pointer hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 active:scale-[0.98] h-[38px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
            Send
          </button>
        )}
      </div>
    </form>
  );
};
