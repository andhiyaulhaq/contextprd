'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// @ts-ignore
import CodeBlock from '@tiptap/extension-code-block';
import { Markdown } from 'tiptap-markdown';
import { useProjectStore } from '../../store/useProjectStore';
import { EditorToolbar } from './EditorToolbar';
import { useAIStream } from '../../hooks/useAIStream';
import { compileInlineContext } from '../../lib/ai/promptCompiler';
import { resolveModelEndpoints } from '../../lib/ai/router';
import { CodeBlockNodeView } from './CodeBlockNodeView';

interface BlockEditorProps {
  onModeChange?: (mode: 'wysiwyg' | 'markdown') => void;
  currentMode?: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ onModeChange, currentMode }) => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const project = activeProjectId ? projects[activeProjectId] : null;
  const activeFile = project
    ? project.fileTree.find((f) => f.id === project.activeFileId)
    : null;

  const [wordCount, setWordCount] = useState(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showCmdK, setShowCmdK] = useState(false);
  const [cmdKQuery, setCmdKQuery] = useState('');
  const [draftState, setDraftState] = useState<'idle' | 'streaming' | 'review'>('idle');
  const [aiDraftText, setAiDraftText] = useState('');
  const draftOriginalRef = useRef<{from: number, to: number, text: string} | null>(null);
  
  const { sendQuery, abort } = useAIStream();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block
      }),
      CodeBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockNodeView);
        },
      }),
      Markdown, // Handles parsing/serializing markdown strings
    ],
    content: activeFile?.content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'markdown-content focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeFile || !project) return;
      
      // Serialize back to markdown string
      const markdown = (editor.storage as any).markdown.getMarkdown();
      
      // Calculate word count
      const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
      setWordCount(words);

      // Debounce saving to the store
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        updateFileContent(project.id, activeFile.id, markdown);
      }, 500);
    },
  });

  // Re-sync content if active file changes
  useEffect(() => {
    if (editor && activeFile && (editor.storage as any).markdown.getMarkdown() !== activeFile.content) {
      editor.commands.setContent(activeFile.content);
      const words = activeFile.content.trim() ? activeFile.content.trim().split(/\s+/).length : 0;
      setWordCount(words);
    }
  }, [activeFile?.id, editor]);

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 bg-gray-950">
        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm">Select a file to begin editing</span>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (draftState !== 'idle') return;
      setShowCmdK(true);
    }
    if (e.key === 'Escape') {
      if (showCmdK) setShowCmdK(false);
      if (draftState === 'review') handleReject();
    }
  };

  const executeCmdK = () => {
    if (!cmdKQuery.trim() || !editor || !activeFile || !project) return;
    
    setShowCmdK(false);
    setDraftState('streaming');

    const selection = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(0, selection.from, '\n');
    
    draftOriginalRef.current = {
      from: selection.from,
      to: selection.to,
      text: editor.getHTML()
    };

    const promptText = compileInlineContext(
      (editor.storage as any).markdown.getMarkdown(), 
      textBefore.length, 
      cmdKQuery
    );
    const models = resolveModelEndpoints('SKILL_WRITER');

    const modelIds = models.map(m => m.modelId);

    sendQuery(promptText, modelIds, {
      onChunk: (text) => {
        setAiDraftText(text);
      },
      onComplete: (text) => {
        const normalizedText = text.replace(/\r\n/g, '\n');
        editor.commands.insertContent(normalizedText);
        setAiDraftText('');
        setDraftState('review');
        setCmdKQuery('');
      },
      onError: (err) => {
        console.error("Inline generation error:", err);
        alert(`AI Error: ${err.message}`);
        setAiDraftText('');
        setDraftState('idle');
        draftOriginalRef.current = null;
        setCmdKQuery('');
      }
    });
  };

  const handleAccept = () => {
    setDraftState('idle');
    draftOriginalRef.current = null;
  };

  const handleReject = () => {
    if (!editor || !draftOriginalRef.current) return;
    abort();
    
    editor.commands.setContent(draftOriginalRef.current.text);
    
    setDraftState('idle');
    draftOriginalRef.current = null;
  };

  return (
    <div className="flex flex-col h-full relative bg-gray-950 text-gray-200" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400 font-mono truncate">{activeFile.path}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 mr-2">{wordCount} words</span>
          {onModeChange ? (
             <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-800">
               <button onClick={() => onModeChange('wysiwyg')} className={`text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider font-semibold ${currentMode === 'wysiwyg' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>VISUAL</button>
               <button onClick={() => onModeChange('markdown')} className={`text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider font-semibold ${currentMode === 'markdown' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>MARKDOWN</button>
             </div>
          ) : (
            <span className="text-xs text-indigo-400/50 uppercase tracking-wider font-semibold border border-indigo-500/20 px-2 py-0.5 rounded-full bg-indigo-500/5">
              VISUAL
            </span>
          )}
        </div>
      </div>
      
      <EditorToolbar editor={editor} />
      
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
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
        <div className="absolute top-1/4 left-1/4 w-1/2 bg-gray-900/95 backdrop-blur border border-indigo-500/50 shadow-2xl rounded-lg p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-800 pb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-medium text-indigo-400">AI is generating content...</span>
          </div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {aiDraftText}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={handleReject} className="text-xs text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-md cursor-pointer transition-all active:scale-[0.98]">Cancel</button>
          </div>
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
