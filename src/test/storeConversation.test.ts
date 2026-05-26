import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { ChatMessage } from '../types/workspace';

beforeEach(() => {
  useWorkspaceStore.setState({
    workspaces: {},
    activeWorkspaceId: null,
    sessionCost: 0,
    streamingMessageId: null,
    deepAuditMode: false,
    sidebarOpen: true,
  });
});

describe('Conversation CRUD', () => {
  it('creates a workspace with a default conversation', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'WEB_APP');
    const ws = useWorkspaceStore.getState().workspaces[wsId];
    expect(ws.conversations).toHaveLength(1);
    expect(ws.conversations[0].name).toBe('Conversation 1');
    expect(ws.activeConversationId).toBe(ws.conversations[0].id);
    expect(ws.conversations[0].messages).toEqual([]);
  });

  it('adds a message to the active conversation', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'GENERAL_SAAS');
    const msg: ChatMessage = { id: 'msg-1', role: 'user', content: 'hello', timestamp: Date.now() };
    useWorkspaceStore.getState().addChatMessage(wsId, msg);

    const ws = useWorkspaceStore.getState().workspaces[wsId];
    const activeConv = ws.conversations.find((c) => c.id === ws.activeConversationId);
    expect(activeConv?.messages).toHaveLength(1);
    expect(activeConv?.messages[0].content).toBe('hello');
  });

  it('creates and switches to a new conversation', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'WEB_APP');
    const firstConvId = useWorkspaceStore.getState().workspaces[wsId].activeConversationId;

    const conv2Id = useWorkspaceStore.getState().createConversation(wsId, 'My New Chat');
    const ws = useWorkspaceStore.getState().workspaces[wsId];
    expect(ws.conversations).toHaveLength(2);
    expect(ws.activeConversationId).toBe(conv2Id);
    expect(ws.activeConversationId).not.toBe(firstConvId);
  });

  it('switches active conversation', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'MOBILE_APP');
    const conv1Id = useWorkspaceStore.getState().workspaces[wsId].activeConversationId!;

    const conv2Id = useWorkspaceStore.getState().createConversation(wsId, 'Second');
    useWorkspaceStore.getState().switchConversation(wsId, conv1Id);
    expect(useWorkspaceStore.getState().workspaces[wsId].activeConversationId).toBe(conv1Id);
  });

  it('ignores switching to non-existent conversation', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'NATIVE_DESKTOP');
    const currentId = useWorkspaceStore.getState().workspaces[wsId].activeConversationId;

    useWorkspaceStore.getState().switchConversation(wsId, 'non-existent');
    expect(useWorkspaceStore.getState().workspaces[wsId].activeConversationId).toBe(currentId);
  });

  it('renames a conversation', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'WEB_APP');
    const convId = useWorkspaceStore.getState().workspaces[wsId].activeConversationId!;

    useWorkspaceStore.getState().renameConversation(wsId, convId, 'Renamed Chat');
    const conv = useWorkspaceStore.getState().workspaces[wsId].conversations.find((c) => c.id === convId);
    expect(conv?.name).toBe('Renamed Chat');
  });

  it('deletes last conversation and falls back to a fresh one', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'WEB_APP');
    const convId = useWorkspaceStore.getState().workspaces[wsId].activeConversationId!;

    useWorkspaceStore.getState().deleteConversation(wsId, convId);
    const ws = useWorkspaceStore.getState().workspaces[wsId];
    expect(ws.conversations).toHaveLength(1);
    expect(ws.activeConversationId).toBe(ws.conversations[0].id);
    expect(ws.conversations[0].messages).toEqual([]);
  });

  it('deletes a non-active conversation without switching', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'WEB_APP');
    const conv1Id = useWorkspaceStore.getState().workspaces[wsId].activeConversationId!;
    useWorkspaceStore.getState().createConversation(wsId, 'Second');
    const conv2Id = useWorkspaceStore.getState().workspaces[wsId].activeConversationId!;

    useWorkspaceStore.getState().deleteConversation(wsId, conv1Id);
    const ws = useWorkspaceStore.getState().workspaces[wsId];
    expect(ws.conversations).toHaveLength(1);
    expect(ws.activeConversationId).toBe(conv2Id);
  });

  it('messages are isolated between conversations', () => {
    const wsId = useWorkspaceStore.getState().createWorkspace('Test', 'WEB_APP');
    const conv1Id = useWorkspaceStore.getState().workspaces[wsId].activeConversationId!;

    useWorkspaceStore.getState().addChatMessage(wsId, {
      id: 'msg-1', role: 'user', content: 'in conv1', timestamp: Date.now(),
    });

    const conv2Id = useWorkspaceStore.getState().createConversation(wsId, 'Second');
    useWorkspaceStore.getState().addChatMessage(wsId, {
      id: 'msg-2', role: 'user', content: 'in conv2', timestamp: Date.now(),
    });

    useWorkspaceStore.getState().switchConversation(wsId, conv1Id);
    const conv1 = useWorkspaceStore.getState().workspaces[wsId].conversations.find((c) => c.id === conv1Id);
    expect(conv1?.messages).toHaveLength(1);
    expect(conv1?.messages[0].content).toBe('in conv1');

    useWorkspaceStore.getState().switchConversation(wsId, conv2Id);
    const conv2 = useWorkspaceStore.getState().workspaces[wsId].conversations.find((c) => c.id === conv2Id);
    expect(conv2?.messages).toHaveLength(1);
    expect(conv2?.messages[0].content).toBe('in conv2');
  });
});
