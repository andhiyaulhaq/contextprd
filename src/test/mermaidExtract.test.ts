import { describe, it, expect } from 'vitest';
import { extractMermaidBlocks } from '../lib/mermaid/extractBlocks';

describe('extractMermaidBlocks', () => {
  it('returns a single text segment when no mermaid blocks exist', () => {
    const segments = extractMermaidBlocks('Just plain text');
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
    if (segments[0].type === 'text') {
      expect(segments[0].content).toBe('Just plain text');
    }
  });

  it('extracts a single mermaid block', () => {
    const content = '```mermaid\ngraph TD;\nA-->B;\n```';
    const segments = extractMermaidBlocks(content);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('mermaid');
    if (segments[0].type === 'mermaid') {
      expect(segments[0].chartDefinition).toBe('graph TD;\nA-->B;');
    }
  });

  it('splits text and mermaid segments', () => {
    const content = 'Before\n```mermaid\ngraph TD;\nA-->B;\n```\nAfter';
    const segments = extractMermaidBlocks(content);
    expect(segments).toHaveLength(3);
    expect(segments[0].type).toBe('text');
    expect(segments[1].type).toBe('mermaid');
    expect(segments[2].type).toBe('text');
    if (segments[0].type === 'text') expect(segments[0].content).toBe('Before\n');
    if (segments[2].type === 'text') expect(segments[2].content).toBe('\nAfter');
  });

  it('extracts multiple mermaid blocks', () => {
    const content = 'A\n```mermaid\ng1\n```\nB\n```mermaid\ng2\n```\nC';
    const segments = extractMermaidBlocks(content);
    expect(segments).toHaveLength(5);
    const mermaidSegs = segments.filter((s) => s.type === 'mermaid');
    expect(mermaidSegs).toHaveLength(2);
  });

  it('handles empty content', () => {
    const segments = extractMermaidBlocks('');
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
    if (segments[0].type === 'text') expect(segments[0].content).toBe('');
  });

  it('handles content with only mermaid fences and no code', () => {
    const content = '```mermaid\n```';
    const segments = extractMermaidBlocks(content);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('mermaid');
    if (segments[0].type === 'mermaid') {
      expect(segments[0].chartDefinition).toBe('');
    }
  });

  it('assigns incrementing block indices', () => {
    const content = '```mermaid\na\n```\n```mermaid\nb\n```';
    const segments = extractMermaidBlocks(content);
    const mermaidSegs = segments.filter((s) => s.type === 'mermaid');
    expect(mermaidSegs).toHaveLength(2);
    if (mermaidSegs[0].type === 'mermaid') expect(mermaidSegs[0].index).toBe(0);
    if (mermaidSegs[1].type === 'mermaid') expect(mermaidSegs[1].index).toBe(1);
  });
});
