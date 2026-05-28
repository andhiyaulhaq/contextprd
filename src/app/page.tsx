'use client';

import React, { useState } from 'react';
import { ProjectSwitcher } from '../components/sidebar/ProjectSwitcher';
import { ProjectTree } from '../components/sidebar/ProjectTree';
import { BlockEditor } from '../components/editor/BlockEditor';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { useProjectStore } from '../store/useProjectStore';
import { useConversationStore } from '../store/useConversationStore';

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
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');

  if (!projectHydrated || !conversationHydrated) {
    return <AppLoadingSkeleton />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200">
      <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <ProjectSwitcher />
        <div className="flex-1 overflow-y-auto">
          <ProjectTree />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {editorMode === 'wysiwyg' ? (
          <BlockEditor onModeChange={setEditorMode} currentMode={editorMode} />
        ) : (
          <MarkdownEditor onModeChange={setEditorMode} />
        )}
      </main>

      <aside className="w-80 shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col">
        <ChatSidebar />
      </aside>
    </div>
  );
}
