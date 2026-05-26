'use client';

import React, { useMemo } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { MermaidRenderer } from './MermaidRenderer';

interface MarkdownRendererProps {
  content: string;
  onMermaidError?: (error: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onMermaidError }) => {
  const html = useMemo(() => {
    const mermaidBlocks: string[] = [];
    let processed = content;

    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = mermaidRegex.exec(content)) !== null) {
      const placeholder = `MERMAIDBLOCKPLACEHOLDER${idx}`;
      mermaidBlocks.push(match[1].trim());
      processed = processed.replace(match[0], placeholder);
      idx++;
    }

    const file = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(processed);

    let result = String(file);

    mermaidBlocks.forEach((block, i) => {
      const placeholder = `MERMAIDBLOCKPLACEHOLDER${i}`;
      const renderer = `<div class="mermaid-container" data-mermaid-index="${i}">${block}</div>`;
      result = result.replace(placeholder, renderer);
    });

    return result;
  }, [content]);

  const handleMermaidError = (error: string) => {
    onMermaidError?.(error);
  };

  const extractMermaidBlocks = (html: string): string[] => {
    const blocks: string[] = [];
    const containerRegex = /<div class="mermaid-container"[^>]*>([\s\S]*?)<\/div>/g;
    let m: RegExpExecArray | null;
    while ((m = containerRegex.exec(html)) !== null) {
      blocks.push(m[1].trim());
    }
    return blocks;
  };

  const mermaidBlocks = extractMermaidBlocks(html);

  const parts = html.split(/(<div class="mermaid-container"[^>]*>[\s\S]*?<\/div>)/);

  return (
    <div className="markdown-content">
      {parts.map((part, i) => {
        const mermaidMatch = part.match(/data-mermaid-index="(\d+)"/);
        if (mermaidMatch) {
          const idx = parseInt(mermaidMatch[1]);
          return (
            <MermaidRenderer
              key={`mermaid-${i}`}
              chartDefinition={mermaidBlocks[idx] || ''}
              onSyntaxErrorDetected={handleMermaidError}
            />
          );
        }
        return <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
};
