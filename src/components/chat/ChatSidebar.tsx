'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { classifyIntent } from '../../lib/ai/skillRouter';
import { resolveModelEndpoints, ModelRoute } from '../../lib/ai/router';
import { compileContextPayload } from '../../lib/ai/promptCompiler';
import { useOpenRouterStream } from '../../hooks/useOpenRouterStream';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversationPicker } from './ConversationPicker';
import { CostTracker } from './CostTracker';

export const ChatSidebar: React.FC = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const addChatMessage = useWorkspaceStore((s) => s.addChatMessage);
  const updateChatMessage = useWorkspaceStore((s) => s.updateChatMessage);
  const deleteChatMessage = useWorkspaceStore((s) => s.deleteChatMessage);
  const clearChatMessages = useWorkspaceStore((s) => s.clearChatMessages);
  const addToSessionCost = useWorkspaceStore((s) => s.addToSessionCost);
  const streamingMessageId = useWorkspaceStore((s) => s.streamingMessageId);
  const setStreamingMessageId = useWorkspaceStore((s) => s.setStreamingMessageId);
  const deepAuditMode = useWorkspaceStore((s) => s.deepAuditMode);
  const createConversation = useWorkspaceStore((s) => s.createConversation);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendQuery, abort } = useOpenRouterStream();

  const assistantIdRef = useRef<string | null>(null);
  const modelsRef = useRef<ModelRoute[]>([]);
  const promptRef = useRef('');
  const workspaceIdRef = useRef<string | null>(null);
  const intentRef = useRef('');

  const workspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;
  const activeConversation = workspace
    ? workspace.conversations.find((c) => c.id === workspace.activeConversationId) || null
    : null;
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (streamingMessageId) {
      abort();
      setStreamingMessageId(null);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    const handleOffline = () => {
      if (streamingMessageId) {
        abort();
        if (assistantIdRef.current && workspaceIdRef.current) {
          updateChatMessage(workspaceIdRef.current, assistantIdRef.current, 'Connection lost. Response incomplete.');
        }
        setStreamingMessageId(null);
      }
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [streamingMessageId]);

  const tryModel = useCallback((modelIndex: number) => {
    const models = modelsRef.current;
    const prompt = promptRef.current;
    const wsId = workspaceIdRef.current;
    const assistantId = assistantIdRef.current;

    if (!wsId || !assistantId) return;

    if (modelIndex >= models.length) {
      updateChatMessage(wsId, assistantId, 'Error: All available models failed. Please try again later.');
      setStreamingMessageId(null);
      return;
    }

    const model = models[modelIndex];
    updateChatMessage(wsId, assistantId, '');

    if (modelIndex > 0) {
      addChatMessage(wsId, {
        id: `msg-${Date.now() + 4 + modelIndex}`,
        role: 'system',
        content: `Falling back to ${model.modelId}...`,
        timestamp: Date.now(),
      });
    }

    sendQuery(prompt, model.modelId, {
      onChunk: (accumulated) => {
        updateChatMessage(wsId, assistantId, accumulated);
      },
      onComplete: () => {
        setStreamingMessageId(null);
      },
      onError: (streamError) => {
        if (streamError.type === 'no_endpoint' || streamError.type === 'rate_limit') {
          tryModel(modelIndex + 1);
        } else {
          updateChatMessage(wsId, assistantId, `Error: ${streamError.message}`);
          setStreamingMessageId(null);
        }
      },
    });
  }, [addChatMessage, updateChatMessage, setStreamingMessageId, sendQuery]);

  const handleNewChat = useCallback(() => {
    if (!workspace) return;
    abort();
    createConversation(workspace.id, `Conversation ${(workspace.conversations.length + 1)}`);
    setStreamingMessageId(null);
  }, [workspace, abort, createConversation, setStreamingMessageId]);

  const handleSend = useCallback(async (userQuery: string) => {
    if (!workspace || streamingMessageId) return;

    const wsId = workspace.id;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: userQuery,
      timestamp: Date.now(),
    };
    addChatMessage(wsId, userMessage);

    const activeFile = workspace.fileTree.find((f) => f.id === workspace.activeFileId);
    if (!activeFile) {
      addChatMessage(wsId, {
        id: `msg-${Date.now() + 1}`,
        role: 'system',
        content: 'No active file selected. Please select a file to ask AI about.',
        timestamp: Date.now(),
      });
      return;
    }

    const { intent } = classifyIntent(userQuery);
    const models = resolveModelEndpoints(intent);
    const { prompt } = compileContextPayload(workspace, activeFile, userQuery, deepAuditMode);

    const promptTokens = prompt.split(/\s+/).length;
    const estimatedCost = (promptTokens / 1_000_000) * models[0].costPerMillionInput;
    addToSessionCost(estimatedCost);

    addChatMessage(wsId, {
      id: `msg-${Date.now() + 2}`,
      role: 'system',
      content: `Routing to ${intent} via ${models[0].modelId}...`,
      timestamp: Date.now(),
    });

    const assistantId = `msg-${Date.now() + 3}`;
    addChatMessage(wsId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: models[0].modelId,
      estimatedCost,
    });

    workspaceIdRef.current = wsId;
    assistantIdRef.current = assistantId;
    modelsRef.current = models;
    promptRef.current = prompt;
    intentRef.current = intent;

    setStreamingMessageId(assistantId);
    tryModel(0);
  }, [workspace, streamingMessageId, addChatMessage, addToSessionCost, deepAuditMode, setStreamingMessageId, tryModel]);

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

  const isStreaming = streamingMessageId !== null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Chat</span>
        <div className="mx-1 flex-1 min-w-0">
          <ConversationPicker workspace={workspace} />
        </div>
        <button
          onClick={handleNewChat}
          disabled={isStreaming}
          className="text-xs text-gray-600 hover:text-gray-400 disabled:opacity-30 transition-all px-2 py-1 rounded-md hover:bg-gray-800/60 shrink-0"
          title="New conversation"
        >
          + New
        </button>
        {isStreaming && (
          <span className="text-xs text-indigo-400 animate-pulse shrink-0">Streaming...</span>
        )}
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
          <ChatMessage
            key={msg.id}
            message={msg}
            isStreaming={msg.id === streamingMessageId}
            onDelete={!isStreaming ? () => deleteChatMessage(workspace.id, msg.id) : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <CostTracker />
      <ChatInput onSend={handleSend} isStreaming={isStreaming} onStop={abort} />
    </div>
  );
};
