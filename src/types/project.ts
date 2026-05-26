export type DomainCategory = 'WEB_APP' | 'NATIVE_DESKTOP' | 'MOBILE_APP' | 'GENERAL_SAAS';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'markdown' | 'directory';
  children?: FileNode[];
}

export interface DomainProfile {
  category: DomainCategory;
  systemGuardrails: string;
  templateBlueprint: Record<string, string>;
}

export interface Conversation {
  id: string;
  projectId: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  rootPath: string;
  profile: DomainProfile;
  fileTree: FileNode[];
  activeFileId: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  estimatedCost?: number;
}

export type SkillIntent = 'SKILL_WRITER' | 'SKILL_ARCHITECT' | 'SKILL_AUDITOR';
