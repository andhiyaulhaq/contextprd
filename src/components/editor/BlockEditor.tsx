'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { useProjectStore } from '../../store/useProjectStore';
import { EditorToolbar } from './EditorToolbar';

export const BlockEditor: React.FC = () => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const project = activeProjectId ? projects[activeProjectId] : null;
  const activeFile = project
    ? project.fileTree.find((f) => f.id === project.activeFileId)
    : null;

  const [wordCount, setWordCount] = useState(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown, // Handles parsing/serializing markdown strings
    ],
    content: activeFile?.content || '',
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

  return (
    <div className="flex flex-col h-full relative bg-gray-950 text-gray-200">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400 font-mono truncate">{activeFile.path}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 mr-2">{wordCount} words</span>
          <span className="text-xs text-indigo-400/50 uppercase tracking-wider font-semibold border border-indigo-500/20 px-2 py-0.5 rounded-full bg-indigo-500/5">
            WYSIWYG
          </span>
        </div>
      </div>
      
      <EditorToolbar editor={editor} />
      
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showCmdK &&