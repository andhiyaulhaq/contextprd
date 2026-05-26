'use client';

import React from 'react';
import { WorkspaceSwitcher } from '../components/sidebar/WorkspaceSwitcher';
import { WorkspaceTree } from '../components/sidebar/WorkspaceTree';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ChatSidebar } from '../components/chat/ChatSidebar';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-200">
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <WorkspaceSwitcher />
        <div className="flex-1 overflow-y-auto">
          <WorkspaceTree />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <MarkdownEditor />
      </main>

      <aside className="w-80 flex-shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col">
        <ChatSidebar />
      </aside>
    </div>
  );
}
