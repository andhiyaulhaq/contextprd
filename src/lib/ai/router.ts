import { SkillIntent } from '../../types/project';

export interface ModelRoute {
  modelId: string;
  costPerMillionInput: number;
}

const MODEL_REGISTRY: Record<SkillIntent, ModelRoute[]> = {
  SKILL_WRITER: [
    { modelId: '9router:free-combo', costPerMillionInput: 0 },
  ],
  SKILL_ARCHITECT: [
    { modelId: '9router:free-combo', costPerMillionInput: 0 },
  ],
  SKILL_AUDITOR: [
    { modelId: '9router:free-combo', costPerMillionInput: 0 },
  ],
};

export function resolveModelEndpoints(skill: SkillIntent): ModelRoute[] {
  return MODEL_REGISTRY[skill];
}
