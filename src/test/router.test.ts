import { describe, it, expect } from 'vitest';
import { resolveModelEndpoints } from '../lib/ai/router';

describe('resolveModelEndpoints', () => {
  it('returns SKILL_WRITER endpoint chain', () => {
    const routes = resolveModelEndpoints('SKILL_WRITER');
    expect(routes.length).toBeGreaterThanOrEqual(1);
    expect(routes[0].modelId).toBeTruthy();
    expect(routes[0].costPerMillionInput).toBe(0.075);
  });

  it('returns SKILL_ARCHITECT endpoint chain', () => {
    const routes = resolveModelEndpoints('SKILL_ARCHITECT');
    expect(routes.length).toBeGreaterThanOrEqual(1);
    expect(routes[0].modelId).toBeTruthy();
    expect(routes[0].costPerMillionInput).toBe(0.075);
  });

  it('returns SKILL_AUDITOR endpoint chain', () => {
    const routes = resolveModelEndpoints('SKILL_AUDITOR');
    expect(routes.length).toBeGreaterThanOrEqual(1);
    expect(routes[0].modelId).toBeTruthy();
    expect(routes[0].costPerMillionInput).toBe(0.075);
  });

  it('returns at least 2 fallback models for each intent', () => {
    for (const intent of ['SKILL_WRITER', 'SKILL_ARCHITECT', 'SKILL_AUDITOR'] as const) {
      const routes = resolveModelEndpoints(intent);
      expect(routes.length).toBeGreaterThanOrEqual(2);
    }
  });
});
