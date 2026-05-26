import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../store/useProjectStore';
import { useConversationStore } from '../store/useConversationStore';
import { ChatMessage } from '../types/project';

beforeEach(() => {
  useProjectStore.setState({
    projects: {},
    activeProjectId: null,
  });
  useConversationStore.setState({
    conversations: {},
    activeConversationId: null,
  });
});

describe('Conversation CRUD', () => {
  it('creates a project with a default conversation', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'WEB_APP');
    const convs = useConversationStore.getState().getConversationsForProject(wsId);
    expect(convs).toHaveLength(1);
    expect(convs[0].name).toBe('Conversation 1');
    expect(useConversationStore.getState().activeConversationId).toBe(convs[0].id);
    expect(convs[0].messages).toEqual([]);
  });

  it('adds a message to the active conversation', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'GENERAL_SAAS');
    const convId = useConversationStore.getState().activeConversationId!;
    const msg: ChatMessage = { id: 'msg-1', role: 'user', content: 'hello', timestamp: Date.now() };
    useConversationStore.getState().addChatMessage(convId, msg);

    const activeConv = useConversationStore.getState().getActiveConversation();
    expect(activeConv?.messages).toHaveLength(1);
    expect(activeConv?.messages[0].content).toBe('hello');
  });

  it('creates and switches to a new conversation', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'WEB_APP');
    const firstConvId = useConversationStore.getState().activeConversationId;

    const conv2Id = useConversationStore.getState().createConversation(wsId, 'My New Chat');
    const convs = useConversationStore.getState().getConversationsForProject(wsId);
    expect(convs).toHaveLength(2);
    expect(useConversationStore.getState().activeConversationId).toBe(conv2Id);
    expect(useConversationStore.getState().activeConversationId).not.toBe(firstConvId);
  });

  it('switches active conversation', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'MOBILE_APP');
    const conv1Id = useConversationStore.getState().activeConversationId!;

    useConversationStore.getState().createConversation(wsId, 'Second');
    useConversationStore.getState().switchConversation(conv1Id);
    expect(useConversationStore.getState().activeConversationId).toBe(conv1Id);
  });

  it('ignores switching to non-existent conversation', () => {
    useProjectStore.getState().createProject('Test', 'NATIVE_DESKTOP');
    const currentId = useConversationStore.getState().activeConversationId;

    useConversationStore.getState().switchConversation('non-existent');
    expect(useConversationStore.getState().activeConversationId).toBe(currentId);
  });

  it('renames a conversation', () => {
    useProjectStore.getState().createProject('Test', 'WEB_APP');
    const convId = useConversationStore.getState().activeConversationId!;

    useConversationStore.getState().renameConversation(convId, 'Renamed Chat');
    const conv = useConversationStore.getState().conversations[convId];
    expect(conv?.name).toBe('Renamed Chat');
  });

  it('deletes last conversation and falls back to a fresh one', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'WEB_APP');
    const convId = useConversationStore.getState().activeConversationId!;

    useConversationStore.getState().deleteConversation(convId);
    const convs = useConversationStore.getState().getConversationsForProject(wsId);
    expect(convs).toHaveLength(1);
    expect(useConversationStore.getState().activeConversationId).toBe(convs[0].id);
    expect(convs[0].messages).toEqual([]);
  });

  it('deletes a non-active conversation without switching', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'WEB_APP');
    const conv1Id = useConversationStore.getState().activeConversationId!;
    useConversationStore.getState().createConversation(wsId, 'Second');
    const conv2Id = useConversationStore.getState().activeConversationId!;

    useConversationStore.getState().deleteConversation(conv1Id);
    const convs = useConversationStore.getState().getConversationsForProject(wsId);
    expect(convs).toHaveLength(1);
    expect(useConversationStore.getState().activeConversationId).toBe(conv2Id);
  });

  it('messages are isolated between conversations', () => {
    const wsId = useProjectStore.getState().createProject('Test', 'WEB_APP');
    const conv1Id = useConversationStore.getState().activeConversationId!;

    useConversationStore.getState().addChatMessage(conv1Id, {
      id: 'msg-1', role: 'user', content: 'in conv1', timestamp: Date.now(),
    });

    const conv2Id = useConversationStore.getState().createConversation(wsId, 'Second');
    useConversationStore.getState().addChatMessage(conv2Id, {
      id: 'msg-2', role: 'user', content: 'in conv2', timestamp: Date.now(),
    });

    const conv1 = useConversationStore.getState().conversations[conv1Id];
    expect(conv1?.messages).toHaveLength(1);
    expect(conv1?.messages[0].content).toBe('in conv1');

    const conv2 = useConversationStore.getState().conversations[conv2Id];
    expect(conv2?.messages).toHaveLength(1);
    expect(conv2?.messages[0].content).toBe('in conv2');
  });
});
