'use client';

import React from 'react';
import { WorkspaceSwitcher } from '../components/sidebar/WorkspaceSwitcher';
import { WorkspaceTree } from '../components/sidebar/WorkspaceTree';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useConversationStore } from '../store/useConversationStore';

function AppLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Loading workspace...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const workspaceHydrated = useWorkspaceStore((s) => s.hasHydrated);
  const conversationHydrated = useConversationStore((s) => s.hasHydrated);

  if (!workspaceHydrated || !conversationHydrated) {
    return <AppLoadingSkeleton />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200">
      <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <WorkspaceSwitcher />
        <div className="flex-1 overflow-y-auto">
          <WorkspaceTree />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <MarkdownEditor />
      </main>

      <aside className="w-80 shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col">
        <ChatSidebar />
      </aside>
    </div>
  );
}
