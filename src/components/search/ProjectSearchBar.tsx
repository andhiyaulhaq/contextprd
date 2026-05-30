'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useSemanticSearch, SearchResult } from '../../hooks/useSemanticSearch';
import { useProjectStore } from '../../store/useProjectStore';

interface ProjectSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSearchBar: React.FC<ProjectSearchBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { search, workerStatus } = useSemanticSearch();
  
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const project = activeProjectId ? projects[activeProjectId] : null;

  const [isSearching, startSearchTransition] = useTransition();

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      // Timeout to ensure modal has mounted and is visible
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Execute hybrid search whenever query changes
  useEffect(() => {
    if (!query.trim() || !project) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const matches = await search(query);
        setResults(matches);
        setSelectedIndex(0);
      });
    }, 150); // Debounce input typing slightly

    return () => clearTimeout(timer);
  }, [query, search, project]);

  // Handle global keyboard trigger (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // If we have a project, open the search bar
          if (project) {
            // Trigger opening via parent component or trigger event
            window.dispatchEvent(new CustomEvent('toggle-project-search'));
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [isOpen, onClose, project]);

  // Handle modal-specific keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleOpenFile(results[selectedIndex].fileId);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleOpenFile = (fileId: string) => {
    if (!project) return;
    setActiveFile(project.id, fileId);
    onClose();
  };

  const handleMentionFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation(); // Avoid triggering open file
    window.dispatchEvent(
      new CustomEvent('insert-chat-mention', {
        detail: { fileName },
      })
    );
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-gray-950/40">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 bg-gray-950/20">
          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by content or meaning (Cmd+K)..."
            className="flex-1 min-w-0 bg-transparent text-gray-200 text-sm outline-none placeholder-gray-600"
          />
          
          {/* Status Indicator */}
          <div className="shrink-0 flex items-center gap-1.5">
            {workerStatus === 'loading' && (
              <span className="flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-1.5 py-0.5">
                <svg className="animate-spin h-3 w-3 text-indigo-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Semantic Loading
              </span>
            )}
            {workerStatus === 'ready' && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-md px-1.5 py-0.5" title="Hybrid Semantic Search Active">
                Semantic AI
              </span>
            )}
            {workerStatus === 'unavailable' && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-800 border border-gray-700 rounded-md px-1.5 py-0.5" title="Falling back to traditional search">
                Traditional Only
              </span>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-900/40">
          {query.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <svg className="w-12 h-12 text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-400">Search Workspace PRDs</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xs leading-relaxed">
                Type keywords to find exact matches, or complete sentences to search conceptually.
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex justify-center items-center py-16">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <svg className="w-10 h-10 text-gray-800 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-500">No matching files found</h3>
              <p className="text-xs text-gray-600 mt-0.5">Try widening your search terms</p>
            </div>
          ) : (
            <div ref={listRef} className="py-2">
              {results.map((res, index) => {
                const isSelected = index === selectedIndex;
                const matchPercent = res.semanticScore ? Math.round(res.semanticScore * 100) : null;
                
                return (
                  <div
                    key={res.fileId}
                    onClick={() => handleOpenFile(res.fileId)}
                    className={`px-4 py-3 cursor-pointer transition-all flex items-start gap-3 relative group ${
                      isSelected ? 'bg-indigo-600/10 text-indigo-300 border-l-4 border-indigo-500 -ml-1' : 'hover:bg-gray-800/40 text-gray-300 border-l-4 border-transparent'
                    }`}
                  >
                    {/* File icon */}
                    <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-gray-300'}`}>
                          {res.fileName}
                        </span>
                        
                        {/* Similarity Score Badge */}
                        {matchPercent !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            matchPercent > 80 
                              ? 'bg-teal-500/10 text-teal-400' 
                              : matchPercent > 60 
                                ? 'bg-indigo-500/10 text-indigo-400' 
                                : 'bg-gray-800 text-gray-500'
                          }`}>
                            {matchPercent}% Match
                          </span>
                        )}
                        
                        {/* Keyword Match Indicator */}
                        {res.keywordScore > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                            Keyword
                          </span>
                        )}
                      </div>
                      
                      {/* Search excerpt context */}
                      <p className="text-xs text-gray-500 mt-1 truncate leading-relaxed">
                        {res.excerpt}
                      </p>
                    </div>

                    {/* Mention shortcut button */}
                    <button
                      onClick={(e) => handleMentionFile(e, res.fileName)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 text-[11px] font-semibold text-gray-400 bg-gray-800 border border-gray-700 hover:bg-indigo-600 hover:text-[#ffffff] hover:border-indigo-500 rounded flex items-center gap-1 active:scale-[0.98] shrink-0"
                      title="Mention this file in chat"
                    >
                      <span className="font-mono">@</span> Mention
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search bar Footer */}
        <div className="px-4 py-2 bg-gray-950/40 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-600">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700 font-mono text-[9px]">Esc</kbd> Close
            </span>
            <span>
              <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700 font-mono text-[9px]">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700 font-mono text-[9px]">Enter</kbd> Open file
            </span>
          </div>
          <div>
            Hybrid PRD Search
          </div>
        </div>
      </div>
    </div>
  );
};
