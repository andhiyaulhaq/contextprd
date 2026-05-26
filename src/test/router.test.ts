import { describe, it, expect } from 'vitest';
import { resolveModelEndpoint } from '../lib/ai/router';

describe('resolveModelEndpoint', () => {
  it('returns SKILL_WRITER endpoint', () => {
    const route = resolveModelEndpoint('SKILL_WRITER');
    expect(route.modelId).toBe('google/gemini-flash-1.5:free');
    expect(route.costPerMillionInput).toBe(0);
  });

  it('returns SKILL_ARCHITECT endpoint', () => {
    const route = resolveModelEndpoint('SKILL_ARCHITECT');
    expect(route.modelId).toBe('meta-llama/llama-3-70b-instruct:free');
    expect(route.costPerMillionInput).toBe(0);
  });

  it('returns SKILL_AUDITOR endpoint', () => {
    const route = resolveModelEndpoint('SKILL_AUDITOR');
    expect(route.modelId).toBe('google/gemini-flash-1.5:free');
    expect(route.costPerMillionInput).toBe(0);
  });
});
