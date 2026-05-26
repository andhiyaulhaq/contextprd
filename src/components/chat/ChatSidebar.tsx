'use client';

import React, { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { classifyIntent } from '../../lib/ai/skillRouter';
import { resolveModelEndpoint } from '../../lib/ai/router';
import { compileContextPayload } from '../../lib/ai/promptCompiler';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { CostTracker } from './CostTracker';

export const ChatSidebar: React.FC = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const addChatMessage = useWorkspaceStore((s) => s.addChatMessage);
  const addToSessionCost = useWorkspaceStore((s) => s.addToSessionCost);
  const deepAuditMode = useWorkspaceStore((s) => s.deepAuditMode);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const workspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workspace?.chatMessages]);

  const handleSend = async (userQuery: string) => {
    if (!workspace) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: userQuery,
      timestamp: Date.now(),
    };
    addChatMessage(workspace.id, userMessage);

    const activeFile = workspace.fileTree.find((f) => f.id === workspace.activeFileId);
    if (!activeFile) {
      addChatMessage(workspace.id, {
        id: `msg-${Date.now() + 1}`,
        role: 'system',
        content: 'No active file selected. Please select a file to ask AI about.',
        timestamp: Date.now(),
      });
      return;
    }

    const { intent } = classifyIntent(userQuery);
    const { modelId, costPerMillionInput } = resolveModelEndpoint(intent);
    const { prompt } = compileContextPayload(workspace, activeFile, userQuery, deepAuditMode);

    const promptTokens = prompt.split(/\s+/).length;
    const estimatedCost = (promptTokens / 1_000_000) * costPerMillionInput;
    addToSessionCost(estimatedCost);

    const systemMessage = {
      id: `msg-${Date.now() + 2}`,
      role: 'system' as const,
      content: `Routing to ${intent} via ${modelId}...`,
      timestamp: Date.now(),
    };
    addChatMessage(workspace.id, systemMessage);

    const assistantMessage = {
      id: `msg-${Date.now() + 3}`,
      role: 'assistant' as const,
      content: `[Simulated response for **${intent}**]\n\nThis is where the ${modelId} response would appear after streaming through the OpenRouter API.\n\nConfigure your API key in \`NEXT_PUBLIC_OPENROUTER_API_KEY\` to enable live AI responses.`,
      timestamp: Date.now(),
      modelUsed: modelId,
      estimatedCost,
    };
    addChatMessage(workspace.id, assistantMessage);
  };

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 px-6 text-center">
        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-sm">Select a workspace to start chatting</span>
      </div>
    );
  }

  const messages = workspace.chatMessages || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.length === 0 && (
          <div className="text-gray-600 text-sm text-center mt-8 leading-relaxed">
            <p>Ask AI to draft content,</p>
            <p>generate diagrams,</p>
            <p>or audit your PRD</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <CostTracker />
      <ChatInput onSend={handleSend} disabled={isOffline} />
    </div>
  );
};
