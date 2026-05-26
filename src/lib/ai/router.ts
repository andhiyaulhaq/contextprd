import { SkillIntent } from '../../types/workspace';

interface ModelRoute {
  modelId: string;
  costPerMillionInput: number;
}

const MODEL_REGISTRY: Record<SkillIntent, ModelRoute> = {
  SKILL_WRITER: {
    modelId: 'google/gemini-flash-1.5:free',
    costPerMillionInput: 0.0,
  },
  SKILL_ARCHITECT: {
    modelId: 'meta-llama/llama-3-70b-instruct:free',
    costPerMillionInput: 0.0,
  },
  SKILL_AUDITOR: {
    modelId: 'google/gemini-flash-1.5:free',
    costPerMillionInput: 0.0,
  },
};

export function resolveModelEndpoint(skill: SkillIntent): ModelRoute {
  return MODEL_REGISTRY[skill];
}
