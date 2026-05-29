'use client';

import React, { useState } from 'react';
import { ProjectSwitcher } from '../components/sidebar/ProjectSwitcher';
import { ProjectTree } from '../components/sidebar/ProjectTree';
import { BlockEditor } from '../components/editor/BlockEditor';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { useProjectStore } from '../store/useProjectStore';
import { useConversationStore } from '../store/useConversationStore';
import { useLayoutStore } from '../store/useLayoutStore';

function AppLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Loading project...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const projectHydrated = useProjectStore((s) => s.hasHydrated);
  const conversationHydrated = useConversationStore((s) => s.hasHydrated);
  const { isLeftSidebarOpen, isRightSidebarOpen } = useLayoutStore();
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');

  if (!projectHydrated || !conversationHydrated) {
    return <AppLoadingSkeleton />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200">
      <aside className={`shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out relative ${isLeftSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-r-0'}`}>
        <div className="w-64 h-full flex flex-col">
          <ProjectSwitcher />
          <div className="flex-1 overflow-y-auto">
            <ProjectTree />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {editorMode === 'wysiwyg' ? (
          <BlockEditor onModeChange={setEditorMode} currentMode={editorMode} />
        ) : (
          <MarkdownEditor onModeChange={setEditorMode} />
        )}
      </main>

      <aside className={`shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col transition-all duration-300 ease-in-out relative ${isRightSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}>
        <div className="w-80 h-full flex flex-col">
          <ChatSidebar />
        </div>
      </aside>
    </div>
  );
}
