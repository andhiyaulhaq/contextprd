import nlp from 'compromise';
import { SkillIntent } from '../../types/project';

interface ClassificationResult {
  intent: SkillIntent;
  confidence: number;
}

const INTENT_PATTERNS: Record<SkillIntent, string[]> = {
  SKILL_WRITER: [
    'write', 'expand', 'draft', 'rewrite', 'edit', 'prose',
    'narrative', 'describe', 'explain', 'section', 'paragraph',
  ],
  SKILL_ARCHITECT: [
    'diagram', 'flow', 'chart', 'mermaid', 'architecture',
    'layout', 'visualize', 'schema', 'structure', 'component',
  ],
  SKILL_AUDITOR: [
    'audit', 'compare', 'conflict', 'cross-project', 'review',
    'consistency', 'alignment', 'holistic', 'validate', 'check',
  ],
};

export function classifyIntent(userQuery: string): ClassificationResult {
  const doc = nlp(userQuery);
  const normalized = doc.text().toLowerCase();

  const scores: Record<SkillIntent, number> = {
    SKILL_WRITER: 0,
    SKILL_ARCHITECT: 0,
    SKILL_AUDITOR: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        scores[intent as SkillIntent] += 1;
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted[0][1] === 0) {
    return { intent: 'SKILL_WRITER', confidence: 0 };
  }

  return {
    intent: sorted[0][0] as SkillIntent,
    confidence: sorted[0][1] / (sorted[0][1] + sorted[1][1]),
  };
}
