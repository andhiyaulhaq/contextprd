'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useSessionStore } from '../../store/useSessionStore';
import { classifyIntent } from '../../lib/ai/skillRouter';
import { resolveModelEndpoints, ModelRoute } from '../../lib/ai/router';
import { compileContextPayload } from '../../lib/ai/promptCompiler';
import { useAIStream } from '../../hooks/useAIStream';
import { useSelfHealingOrchestrator } from '../../hooks/useSelfHealingOrchestrator';
import { extractMermaidBlocks } from '../../lib/mermaid/extractBlocks';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversationPicker } from './ConversationPicker';
import { CostTracker } from './CostTracker';

export const ChatSidebar: React.FC = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const addChatMessage = useConversationStore((s) => s.addChatMessage);
  const updateChatMessage = useConversationStore((s) => s.updateChatMessage);
  const deleteChatMessage = useConversationStore((s) => s.deleteChatMessage);
  const createConversation = useConversationStore((s) => s.createConversation);
  const getConversationsForWorkspace = useConversationStore((s) => s.getConversationsForWorkspace);

  const streamingMessageId = useSessionStore((s) => s.streamingMessageId);
  const setStreamingMessageId = useSessionStore((s) => s.setStreamingMessageId);
  const deepAuditMode = useSessionStore((s) => s.deepAuditMode);
  const addToSessionCost = useSessionStore((s) => s.addToSessionCost);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendQuery, sendSilentQuery, abort } = useAIStream();
  const { executeHealCycle } = useSelfHealingOrchestrator();

  const assistantIdRef = useRef<string | null>(null);
  const modelsRef = useRef<ModelRoute[]>([]);
  const promptRef = useRef('');
  const workspaceIdRef = useRef<string | null>(null);
  const intentRef = useRef('');

  const workspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;
  const allConversations = useConversationStore((s) => s.conversations);
  const activeConversation = activeConversationId ? allConversations[activeConversationId] : null;
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
        if (assistantIdRef.current && activeConversationId) {
          updateChatMessage(activeConversationId, assistantIdRef.current, 'Connection lost. Response incomplete.');
        }
        setStreamingMessageId(null);
      }
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [streamingMessageId, activeConversationId]);

  const tryModel = useCallback((modelIndex: number) => {
    const models = modelsRef.current;
    const prompt = promptRef.current;
    const assistantId = assistantIdRef.current;
    const convId = useConversationStore.getState().activeConversationId;

    if (!convId || !assistantId) return;

    if (modelIndex >= models.length) {
      updateChatMessage(convId, assistantId, 'Error: All available models failed. Please try again later.');
      setStreamingMessageId(null);
      return;
    }

    const model = models[modelIndex];
    updateChatMessage(convId, assistantId, '');

    if (modelIndex > 0) {
      addChatMessage(convId, {
        id: `msg-${Date.now() + 4 + modelIndex}`,
        role: 'system',
        content: `Falling back to ${model.modelId}...`,
        timestamp: Date.now(),
      });
    }

    sendQuery(prompt, model.modelId, {
      onChunk: (accumulated) => {
        updateChatMessage(convId, assistantId, accumulated);
      },
      onComplete: () => {
        setStreamingMessageId(null);
      },
      onError: (streamError) => {
        if (streamError.type === 'no_endpoint' || streamError.type === 'rate_limit') {
          tryModel(modelIndex + 1);
        } else {
          updateChatMessage(convId, assistantId, `Error: ${streamError.message}`);
          setStreamingMessageId(null);
        }
      },
    });
  }, [addChatMessage, updateChatMessage, setStreamingMessageId, sendQuery]);

  const handleNewChat = useCallback(() => {
    if (!workspace) return;
    abort();
    const wsConvs = getConversationsForWorkspace(workspace.id);
    createConversation(workspace.id, `Conversation ${wsConvs.length + 1}`);
    setStreamingMessageId(null);
  }, [workspace, abort, createConversation, getConversationsForWorkspace, setStreamingMessageId]);

  const handleMermaidError = useCallback(
    async (
      chartDefinition: string,
      errorString: string,
      _blockIndex: number,
      reportResult: (fixedCode: string | null) => void,
    ) => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        reportResult(null);
        return;
      }

      const architectureModels = resolveModelEndpoints('SKILL_ARCHITECT');

      executeHealCycle(
        chartDefinition,
        errorString,
        async (repairPrompt) => {
          const modelId = architectureModels[0]?.modelId || 'gemini-2.5-flash';
          const { text, error } = await sendSilentQuery(repairPrompt, modelId);

          if (error || !text) {
            reportResult(null);
            return;
          }

          const blocks = extractMermaidBlocks(text);
          const fixedBlock = blocks.find((b) => b.type === 'mermaid');
          if (fixedBlock && fixedBlock.type === 'mermaid') {
            reportResult(fixedBlock.chartDefinition);
          } else {
            reportResult(null);
          }
        },
        () => reportResult(null),
      );
    },
    [executeHealCycle, sendSilentQuery],
  );

  const handleSend = useCallback(async (userQuery: string) => {
    if (!workspace || streamingMessageId) return;
    const convId = useConversationStore.getState().activeConversationId;
    if (!convId) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: userQuery,
      timestamp: Date.now(),
    };
    addChatMessage(convId, userMessage);

    const activeFile = workspace.fileTree.find((f) => f.id === workspace.activeFileId);
    if (!activeFile) {
      addChatMessage(convId, {
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

    addChatMessage(convId, {
      id: `msg-${Date.now() + 2}`,
      role: 'system',
      content: `Routing to ${intent} via ${models[0].modelId}...`,
      timestamp: Date.now(),
    });

    const assistantId = `msg-${Date.now() + 3}`;
    addChatMessage(convId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: models[0].modelId,
      estimatedCost,
    });

    workspaceIdRef.current = workspace.id;
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
          <ConversationPicker workspaceId={workspace.id} />
        </div>
        <button
          onClick={handleNewChat}
          disabled={isStreaming}
          className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-all px-2 py-1 rounded-md hover:bg-gray-800/60 shrink-0 active:scale-[0.98]"
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
            onDelete={!isStreaming && activeConversationId ? () => deleteChatMessage(activeConversationId, msg.id) : undefined}
            onMermaidError={handleMermaidError}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <CostTracker />
      <ChatInput onSend={handleSend} isStreaming={isStreaming} onStop={abort} />
    </div>
  );
};
