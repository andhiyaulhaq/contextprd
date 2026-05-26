import { DomainCategory, FileNode } from '../../types/project';
import { TEMPLATES } from './generated';

export function getBlueprint(category: DomainCategory): Record<string, string> {
  return TEMPLATES[category];
}

export function blueprintToFileTree(category: DomainCategory): FileNode[] {
  const blueprint = TEMPLATES[category];
  return Object.entries(blueprint).map(([path, content]) => {
    const name = path.split('/').filter(Boolean).pop() || path;
    return {
      id: `template-${category.toLowerCase()}-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      path,
      content,
      type: 'markdown',
    };
  });
}
