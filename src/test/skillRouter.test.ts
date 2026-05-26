import { describe, it, expect } from 'vitest';
import { classifyIntent } from '../lib/ai/skillRouter';

describe('classifyIntent', () => {
  it('classifies writing intent', () => {
    const result = classifyIntent('write a section about push notifications');
    expect(result.intent).toBe('SKILL_WRITER');
  });

  it('classifies diagram/architecture intent', () => {
    const result = classifyIntent('create a mermaid flow diagram for the auth flow');
    expect(result.intent).toBe('SKILL_ARCHITECT');
  });

  it('classifies audit intent', () => {
    const result = classifyIntent('audit this document for consistency issues');
    expect(result.intent).toBe('SKILL_AUDITOR');
  });

  it('falls back to SKILL_WRITER for unknown intent', () => {
    const result = classifyIntent('hello world');
    expect(result.intent).toBe('SKILL_WRITER');
    expect(result.confidence).toBe(0);
  });

  it('handles mixed intent keywords by picking highest score', () => {
    const result = classifyIntent('write a diagram flow for the architecture');
    expect(result.intent).toBe('SKILL_ARCHITECT');
  });
});
