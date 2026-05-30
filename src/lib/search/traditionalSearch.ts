import { FileNode } from '../../types/project';

export interface TraditionalMatch {
  fileId: string;
  fileName: string;
  /** Raw match count (name matches weighted 3x) */
  score: number;
  /** Snippet around the first match in the file content */
  excerpt: string;
}

function flattenMarkdownFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'markdown') result.push(node);
    if (node.children) result.push(...flattenMarkdownFiles(node.children));
  }
  return result;
}

function getExcerpt(content: string, query: string, windowSize = 100): string {
  const lower = content.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return content.slice(0, windowSize).trim() + (content.length > windowSize ? '...' : '');
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 60);
  return (start > 0 ? '...' : '') + content.slice(start, end).replace(/\n+/g, ' ').trim() + (end < content.length ? '...' : '');
}

/**
 * Fast synchronous full-text search across all markdown files in a project.
 * Name matches are weighted 3x over content matches for relevance scoring.
 */
export function traditionalSearch(query: string, fileTree: FileNode[]): TraditionalMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Escape special regex chars for safe matching
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');

  return flattenMarkdownFiles(fileTree)
    .map((file) => {
      const nameMatches = (file.name.match(regex) ?? []).length;
      const contentMatches = (file.content.match(regex) ?? []).length;
      const score = nameMatches * 3 + contentMatches;
      return score > 0
        ? { fileId: file.id, fileName: file.name, score, excerpt: getExcerpt(file.content, trimmed) }
        : null;
    })
    .filter((r): r is TraditionalMatch => r !== null)
    .sort((a, b) => b.score - a.score);
}
