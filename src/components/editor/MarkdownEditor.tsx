'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { MarkdownRenderer } from './MarkdownRenderer';

type ViewMode = 'edit' | 'preview' | 'split';

export const MarkdownEditor: React.FC = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const updateFileContent = useWorkspaceStore((s) => s.updateFileContent);

  const workspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;
  const activeFile = workspace
    ? workspace.fileTree.find((f) => f.id === workspace.activeFileId)
    : null;

  const [localContent, setLocalContent] = useState(activeFile?.content || '');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setLocalContent(activeFile?.content || '');
  }, [activeFile?.id, activeFile?.content]);

  useEffect(() => {
    if (!activeFile) return;
    const timer = setTimeout(() => {
      if (localContent !== activeFile.content) {
        updateFileContent(workspace!.id, activeFile.id, localContent);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localContent, activeFile?.id]);

  useEffect(() => {
    const words = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [localContent]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      setLocalContent((prev) => prev.substring(0, start) + '  ' + prev.substring(end));
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      }, 0);
    }
  }, []);

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600">
        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm">Select a file to begin editing</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400 font-mono truncate">{activeFile.path}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 mr-1">{wordCount} words</span>
          {(['edit', 'split', 'preview'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`text-xs px-2 py-1 rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {mode === 'edit' ? 'Edit' : mode === 'preview' ? 'Preview' : 'Split'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <textarea
            className={`h-full p-4 bg-transparent text-gray-200 font-mono text-sm resize-none outline-none placeholder-gray-700 leading-relaxed ${
              viewMode === 'split' ? 'w-1/2 border-r border-gray-800' : 'w-full'
            }`}
            value={localContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Start writing markdown..."
          />
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`h-full overflow-y-auto p-4 bg-gray-950/30 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            {localContent.trim() ? (
              <MarkdownRenderer content={localContent} />
            ) : (
              <div className="text-gray-600 text-sm text-center mt-16">
                Nothing to preview — start typing in the editor
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
