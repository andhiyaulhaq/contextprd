'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { StateField, StateEffect, Transaction } from '@codemirror/state';
import { useAIStream } from '../../hooks/useAIStream';
import { compileInlineContext } from '../../lib/ai/promptCompiler';
import { resolveModelEndpoints } from '../../lib/ai/router';

type ViewMode = 'edit' | 'preview' | 'split';

const setDraftRange = StateEffect.define<{from: number, to: number} | null>();

const draftHighlightField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(value: DecorationSet, tr: Transaction) {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setDraftRange)) {
        if (effect.value) {
          value = Decoration.set([
            Decoration.mark({ class: 'bg-indigo-500/20 text-indigo-300 rounded-sm' }).range(effect.value.from, effect.value.to)
          ]);
        } else {
          value = Decoration.none;
        }
      }
    }
    return value;
  },
  provide: (f: StateField<DecorationSet>) => EditorView.decorations.from(f)
});

interface MarkdownEditorProps {
  onModeChange?: (mode: 'wysiwyg' | 'markdown') => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ onModeChange }) => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const project = activeProjectId ? projects[activeProjectId] : null;
  const activeFile = project
    ? project.fileTree.find((f) => f.id === project.activeFileId)
    : null;

  const [localContent, setLocalContent] = useState(activeFile?.content || '');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [wordCount, setWordCount] = useState(0);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  
  const { sendQuery, abort } = useAIStream();

  const [showCmdK, setShowCmdK] = useState(false);
  const [cmdKQuery, setCmdKQuery] = useState('');
  const [draftState, setDraftState] = useState<'idle' | 'streaming' | 'review'>('idle');
  const draftRangeRef = useRef<{from: number, to: number} | null>(null);
  const draftOriginalRef = useRef<{from: number, to: number, text: string} | null>(null);

  useEffect(() => {
    if (draftState === 'idle') {
      const content = activeFile?.content || '';
      setLocalContent(content);
      const timer = setTimeout(() => {
        const view = editorRef.current?.view;
        if (view && view.state.doc.toString() !== content) {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: content }
          });
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [activeFile?.id, activeFile?.content, draftState]);

  useEffect(() => {
    if (!activeFile || draftState !== 'idle') return;
    const timer = setTimeout(() => {
      if (localContent !== activeFile.content) {
        updateFileContent(project!.id, activeFile.id, localContent);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localContent, activeFile?.id, draftState]);

  useEffect(() => {
    const words = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [localContent]);

  useEffect(() => {
    const handleInsert = (e: CustomEvent<{ text: string }>) => {
      const view = editorRef.current?.view;
      if (!view) return;
      
      const selection = view.state.selection.main;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: e.detail.text }
      });
      
      if (project && activeFile) {
        // We delay the update slightly to ensure the view state has updated
        setTimeout(() => {
          const finalContent = view.state.doc.toString();
          updateFileContent(project.id, activeFile.id, finalContent);
        }, 50);
      }
    };
    
    window.addEventListener('insert-editor-text', handleInsert as EventListener);
    return () => window.removeEventListener('insert-editor-text', handleInsert as EventListener);
  }, [project, activeFile, updateFileContent]);

  const handleChange = useCallback((value: string) => {
    setLocalContent(value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (draftState !== 'idle') return;
      setShowCmdK(true);
    }
    if (e.key === 'Escape') {
      if (showCmdK) setShowCmdK(false);
      if (draftState === 'review') handleReject();
    }
  }, [showCmdK, draftState]);

  const executeCmdK = () => {
    if (!cmdKQuery.trim() || !editorRef.current?.view || !activeFile || !project) return;
    
    setShowCmdK(false);
    setDraftState('streaming');

    const view = editorRef.current.view;
    const selection = view.state.selection.main;
    const cursorIndex = selection.from;

    draftOriginalRef.current = {
      from: selection.from,
      to: selection.to,
      text: view.state.sliceDoc(selection.from, selection.to)
    };

    const textBefore = view.state.sliceDoc(0, selection.from);
    const textAfter = view.state.sliceDoc(selection.to);
    const promptText = compileInlineContext(textBefore, textAfter, cmdKQuery, draftOriginalRef.current.text);
    const models = resolveModelEndpoints('SKILL_WRITER');

    const modelIds = models.map(m => m.modelId);

    let accumulatedText = '';

    sendQuery(promptText, modelIds, {
      onChunk: (text) => {
        const view = editorRef.current?.view;
        if (!view || !draftOriginalRef.current) return;

        // CodeMirror automatically normalizes \r\n to \n internally. 
        // We must do the same before calculating lengths, otherwise accumulatedText.length 
        // will overshoot the CodeMirror document length and start deleting the user's document!
        const normalizedText = text.replace(/\r\n/g, '\n');
        
        // On the first chunk, replace the entire user selection.
        // On subsequent chunks, replace the previously generated text.
        const currentTo = accumulatedText.length === 0 
          ? draftOriginalRef.current.to 
          : draftOriginalRef.current.from + accumulatedText.length;
        
        const transaction = view.state.update({
          changes: { from: draftOriginalRef.current.from, to: currentTo, insert: normalizedText }
        });
        view.dispatch(transaction);
        
        accumulatedText = normalizedText;
        
        draftRangeRef.current = { 
          from: draftOriginalRef.current.from, 
          to: draftOriginalRef.current.from + normalizedText.length 
        };

        view.dispatch({
          effects: setDraftRange.of(draftRangeRef.current)
        });
      },
      onComplete: () => {
        setDraftState('review');
        setCmdKQuery('');
      },
      onError: (err) => {
        console.error("Inline generation error:", err);
        // Do not reject completely on error (e.g. rate limit midway).
        // Let the user keep what was generated so far!
        setDraftState('review');
        setCmdKQuery('');
      }
    });
  };

  const handleAccept = () => {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    view.dispatch({ effects: setDraftRange.of(null) });
    setDraftState('idle');
    draftRangeRef.current = null;
    draftOriginalRef.current = null;
    
    if (project && activeFile) {
      const finalContent = view.state.doc.toString();
      updateFileContent(project.id, activeFile.id, finalContent);
    }
  };

  const handleReject = () => {
    if (!editorRef.current?.view || !draftRangeRef.current || !draftOriginalRef.current) return;
    const view = editorRef.current.view;
    
    abort();
    
    view.dispatch({
      changes: {
        from: draftRangeRef.current.from,
        to: Math.min(draftRangeRef.current.to, view.state.doc.length),
        insert: draftOriginalRef.current.text
      },
      effects: setDraftRange.of(null)
    });
    
    setDraftState('idle');
    draftRangeRef.current = null;
    draftOriginalRef.current = null;
  };

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
    <div className="flex flex-col h-full relative" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/50 h-[45px]">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400 font-mono truncate">{activeFile.path}</span>
          <span className="text-xs text-gray-600 ml-2 shrink-0">{wordCount} words</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(['edit', 'split', 'preview'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-all active:scale-[0.98] ${
                viewMode === mode
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {mode === 'edit' ? 'Edit' : mode === 'preview' ? 'Preview' : 'Split'}
            </button>
          ))}
          {onModeChange && (
             <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-800 ml-1">
               <button onClick={() => onModeChange('markdown')} className="cursor-pointer transition-colors text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider font-semibold bg-indigo-500/20 text-indigo-400">MARKDOWN</button>
               <button onClick={() => onModeChange('wysiwyg')} className="cursor-pointer transition-colors text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-300">VISUAL</button>
             </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`h-full bg-transparent text-gray-200 text-sm overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-gray-800' : 'w-full'} ${viewMode === 'preview' ? 'hidden' : ''}`}>
          <CodeMirror
            ref={editorRef}
            height="100%"
            theme="dark"
            extensions={[markdown({ base: markdownLanguage, codeLanguages: languages }), draftHighlightField]}
            onChange={handleChange}
            className="h-full font-mono outline-none"
            readOnly={draftState !== 'idle'}
          />
        </div>
        
        <div className={`h-full overflow-y-auto p-4 bg-gray-950/30 ${viewMode === 'split' ? 'w-1/2' : 'w-full'} ${viewMode === 'edit' ? 'hidden' : ''}`}>
          {localContent.trim() ? (
            <MarkdownRenderer content={localContent} />
          ) : (
            <div className="text-gray-600 text-sm text-center mt-16">
              Nothing to preview — start typing in the editor
            </div>
          )}
        </div>
      </div>

      {showCmdK && (
        <div className="absolute top-16 left-1/4 w-1/2 bg-gray-800 border border-gray-700 shadow-2xl rounded-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <input
            autoFocus
            type="text"
            className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="Ask AI to edit or generate (Press Enter to submit, Esc to cancel)"
            value={cmdKQuery}
            onChange={(e) => setCmdKQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeCmdK();
              if (e.key === 'Escape') setShowCmdK(false);
            }}
          />
        </div>
      )}

      {draftState === 'streaming' && (
        <div className="absolute bottom-6 right-6 bg-gray-800/90 backdrop-blur border border-indigo-500/50 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 z-50">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300">AI is writing...</span>
          <button onClick={handleReject} className="ml-2 text-xs text-gray-400 hover:text-rose-400 cursor-pointer transition-all active:scale-[0.98]">Cancel</button>
        </div>
      )}

      {draftState === 'review' && (
        <div className="absolute bottom-6 right-6 bg-gray-800/95 backdrop-blur border border-gray-600 shadow-2xl rounded-lg p-2 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
          <button onClick={handleAccept} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-md text-xs font-medium cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Accept
          </button>
          <button onClick={handleReject} className="px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-md text-xs font-medium cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Reject
          </button>
        </div>
      )}
    </div>
  );
};
