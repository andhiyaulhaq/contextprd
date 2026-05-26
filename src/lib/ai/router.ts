import { SkillIntent } from '../../types/workspace';

export interface ModelRoute {
  modelId: string;
  costPerMillionInput: number;
}

const MODEL_REGISTRY: Record<SkillIntent, ModelRoute[]> = {
  SKILL_WRITER: [
    { modelId: 'openrouter/free', costPerMillionInput: 0.0 },
    { modelId: 'deepseek/deepseek-v4-flash:free', costPerMillionInput: 0.0 },
    { modelId: 'google/gemini-2.0-flash:free', costPerMillionInput: 0.0 },
    { modelId: 'mistralai/mistral-small-3.1-24b-instruct:free', costPerMillionInput: 0.0 },
  ],
  SKILL_ARCHITECT: [
    { modelId: 'openrouter/free', costPerMillionInput: 0.0 },
    { modelId: 'qwen/qwen3-235b-a22b:free', costPerMillionInput: 0.0 },
    { modelId: 'meta-llama/llama-4-scout:free', costPerMillionInput: 0.0 },
    { modelId: 'deepseek/deepseek-v4-flash:free', costPerMillionInput: 0.0 },
  ],
  SKILL_AUDITOR: [
    { modelId: 'openrouter/free', costPerMillionInput: 0.0 },
    { modelId: 'deepseek/deepseek-r1:free', costPerMillionInput: 0.0 },
    { modelId: 'meta-llama/llama-4-maverick:free', costPerMillionInput: 0.0 },
    { modelId: 'qwen/qwen3-235b-a22b:free', costPerMillionInput: 0.0 },
  ],
};

export function resolveModelEndpoints(skill: SkillIntent): ModelRoute[] {
  return MODEL_REGISTRY[skill];
}
