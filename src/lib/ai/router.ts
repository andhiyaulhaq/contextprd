import { SkillIntent } from '../../types/project';
import { useSettingsStore, MODEL_IDS } from '../../store/useSettingsStore';

export interface ModelRoute {
  modelId: string;
  costPerMillionInput: number;
}

export function resolveModelEndpoints(skill: SkillIntent): ModelRoute[] {
  const { modelForArchitect, modelForWriter, modelForAuditor, ollamaUrl, openAIKey, anthropicKey } = useSettingsStore.getState();

  const getModelId = (choice: string): string => {
    if (choice === 'ollama') return `${ollamaUrl}/api/generate:default`;
    return MODEL_IDS[choice as keyof typeof MODEL_IDS] ?? '9router:free-combo';
  };

  const choiceMap: Record<SkillIntent, string> = {
    SKILL_ARCHITECT: modelForArchitect,
    SKILL_WRITER: modelForWriter,
    SKILL_AUDITOR: modelForAuditor,
  };

  return [{ modelId: getModelId(choiceMap[skill]), costPerMillionInput: 0 }];
}
