export interface TextSegment {
  type: 'text';
  content: string;
}

export interface MermaidSegment {
  type: 'mermaid';
  index: number;
  chartDefinition: string;
  originalFence: string;
}

export type ContentSegment = TextSegment | MermaidSegment;

const MERMAID_FENCE_RE = /```mermaid\s*\n([\s\S]*?)```/g;

export function extractMermaidBlocks(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = MERMAID_FENCE_RE.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: 'text', content: textBefore });
    }

    segments.push({
      type: 'mermaid',
      index: blockIndex++,
      chartDefinition: match[1].trim(),
      originalFence: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    segments.push({ type: 'text', content: remaining });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: '' });
  }

  return segments;
}
