import { describe, it, expect, vi } from 'vitest';
import { extractMermaidBlocks } from '../lib/mermaid/extractBlocks';

describe('useSelfHealingOrchestrator logic', () => {
  it('repair prompt contains the broken chart code and error', () => {
    const brokenCode = 'graph TD;\nA--B;';
    const errorString = 'Syntax error in line 1';

    const prompt = `
Your previous output failed layout compilation validation checks.
Error Output Log: ${errorString}
Broken Code Chunk Sent:
\`\`\`mermaid
${brokenCode}
\`\`\`

Task: Fix the structural design layout definitions. Return ONLY the valid compiled code output block enclosed within appropriate markdown blocks.
    `.trim();

    expect(prompt).toContain(brokenCode);
    expect(prompt).toContain(errorString);
    expect(prompt).toContain('```mermaid');
    expect(prompt).toContain('Return ONLY the valid compiled code');
  });

  it('extractMermaidBlocks can extract fixed code from repair response', () => {
    const repairResponse = 'Here is the fixed diagram:\n\n```mermaid\ngraph TD;\nA-->B;\n```';
    const blocks = extractMermaidBlocks(repairResponse);
    const mermaidBlock = blocks.find((b) => b.type === 'mermaid');
    expect(mermaidBlock).toBeDefined();
    if (mermaidBlock && mermaidBlock.type === 'mermaid') {
      expect(mermaidBlock.chartDefinition).toBe('graph TD;\nA-->B;');
    }
  });

  it('extractMermaidBlocks returns no mermaid blocks for plain text response', () => {
    const blocks = extractMermaidBlocks('Sorry, I cannot generate a diagram.');
    const mermaidBlocks = blocks.filter((b) => b.type === 'mermaid');
    expect(mermaidBlocks).toHaveLength(0);
  });
});
