import { describe, it, expect } from 'vitest';
import { compileContextPayload } from '../lib/ai/promptCompiler';
import { Project, FileNode } from '../types/project';

describe('compileContextPayload', () => {
  const mockFile: FileNode = {
    id: 'file-1',
    name: 'test.md',
    path: '/test.md',
    content: '# Test Content\n\nHello world',
    type: 'markdown',
  };

  const mockProject: Project = {
    id: 'ws-1',
    name: 'Test Project',
    rootPath: '/project',
    profile: {
      category: 'MOBILE_APP',
      systemGuardrails: 'App Store rules, background sync, touch targets',
      templateBlueprint: {},
    },
    fileTree: [mockFile],
    activeFileId: 'file-1',
    conversations: [],
    activeConversationId: null,
  };

  it('includes project metadata in headers', () => {
    const { headers } = compileContextPayload(mockProject, mockFile, 'write an overview');
    expect(headers.projectName).toBe('Test Project');
    expect(headers.domainCategory).toBe('MOBILE_APP');
    expect(headers.activeFilePath).toBe('/test.md');
    expect(headers.timestamp).toBeGreaterThan(0);
  });

  it('includes guardrails in generated prompt', () => {
    const { prompt } = compileContextPayload(mockProject, mockFile, 'write an overview');
    expect(prompt).toContain('App Store rules, background sync, touch targets');
    expect(prompt).toContain('MOBILE_APP');
    expect(prompt).toContain('# Test Content');
    expect(prompt).toContain('write an overview');
  });

  it('includes audit directive when deepAudit is true', () => {
    const { prompt } = compileContextPayload(mockProject, mockFile, 'audit', true);
    expect(prompt).toContain('[DEEP AUDIT MODE]');
  });

  it('omits audit directive when deepAudit is false', () => {
    const { prompt } = compileContextPayload(mockProject, mockFile, 'audit', false);
    expect(prompt).not.toContain('[DEEP AUDIT MODE]');
  });
});
