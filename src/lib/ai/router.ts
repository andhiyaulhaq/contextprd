import { SkillIntent } from '../../types/workspace';

export interface ModelRoute {
  modelId: string;
  costPerMillionInput: number;
}

const MODEL_REGISTRY: Record<SkillIntent, ModelRoute[]> = {
  SKILL_WRITER: [
    { modelId: 'gemini-3.5-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-3-flash-preview', costPerMillionInput: 0.075 },
    { modelId: 'gemini-2.5-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-2.0-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-flash-latest', costPerMillionInput: 0.075 },
    { modelId: 'gemini-3.1-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-2.5-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-2.0-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-flash-lite-latest', costPerMillionInput: 0.00 },
  ],
  SKILL_ARCHITECT: [
    { modelId: 'gemini-3.5-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-3-flash-preview', costPerMillionInput: 0.075 },
    { modelId: 'gemini-2.5-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-2.0-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-flash-latest', costPerMillionInput: 0.075 },
    { modelId: 'gemini-3.1-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-2.5-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-2.0-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-flash-lite-latest', costPerMillionInput: 0.00 },
  ],
  SKILL_AUDITOR: [
    { modelId: 'gemini-3.5-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-3-flash-preview', costPerMillionInput: 0.075 },
    { modelId: 'gemini-2.5-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-2.0-flash', costPerMillionInput: 0.075 },
    { modelId: 'gemini-flash-latest', costPerMillionInput: 0.075 },
    { modelId: 'gemini-3.1-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-2.5-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-2.0-flash-lite', costPerMillionInput: 0.00 },
    { modelId: 'gemini-flash-lite-latest', costPerMillionInput: 0.00 },
  ],
};

export function resolveModelEndpoints(skill: SkillIntent): ModelRoute[] {
  return MODEL_REGISTRY[skill];
}
