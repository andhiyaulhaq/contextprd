'use client';

import React, { useState, useCallback } from 'react';
import { ChatMessage as ChatMessageType } from '../../types/workspace';
import { extractMermaidBlocks, MermaidSegment } from '../../lib/mermaid/extractBlocks';
import { MermaidRenderer } from '../editor/MermaidRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onDelete?: () => void;
  onMermaidError?: (
    chartDefinition: string,
    errorString: string,
    blockIndex: number,
    reportResult: (fixedCode: string | null) => void,
  ) => void;
}

interface MermaidBlockStatus {
  state: 'rendering' | 'repairing' | 'dead';
  fixedCode?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming,
  onDelete,
  onMermaidError,
}) => {
  const [blockStatuses, setBlockStatuses] = useState<Record<number, MermaidBlockStatus>>({});

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const segments = extractMermaidBlocks(message.content);

  const handleSyntaxError = useCallback(
    (chartDefinition: string, errorString: string, index: number) => {
      if (!onMermaidError) return;

      setBlockStatuses((prev) => ({
        ...prev,
        [index]: { state: 'repairing' },
      }));

      onMermaidError(chartDefinition, errorString, index, (fixedCode) => {
        setBlockStatuses((prev) => ({
          ...prev,
          [index]: fixedCode
            ? { state: 'rendering', fixedCode }
            : { state: 'dead' },
        }));
      });
    },
    [onMermaidError],
  );

  const hasOnlyMermaid = segments.every((s) => s.type === 'mermaid');

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 relative`}>
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 rounded-full p-0.5 text-gray-500 hover:text-rose-400 hover:border-rose-500/30 z-10"
          title="Delete message"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div
        className={`${hasOnlyMermaid ? 'max-w-full' : 'max-w-[85%]'
          } rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser
            ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/15'
            : isSystem
              ? 'bg-gray-800/50 text-gray-500 text-xs italic border border-gray-800'
              : 'bg-gray-800/60 text-gray-300 border border-gray-700/50'
          }`}
      >
        {segments.map((segment, i) => {
          if (segment.type === 'text') {
            const isLastSegment = i === segments.length - 1;
            return (
              <div key={i} className="whitespace-pre-wrap wrap-break-words">
                {segment.content + (isStreaming && isLastSegment ? '\u258C' : '')}
              </div>
            );
          }

          const mermaidSeg = segment as MermaidSegment;
          const status = blockStatuses[mermaidSeg.index];
          const chartCode = status?.fixedCode || mermaidSeg.chartDefinition;
          const repairStatus = status?.state === 'repairing'
            ? 'repairing' as const
            : status?.state === 'dead'
              ? 'dead' as const
              : 'idle' as const;

          return (
            <div key={i} className="my-2 relative group/block">
              {!isStreaming && (
                <div className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => {
                      const text = `\n\`\`\`mermaid\n${chartCode}\n\`\`\`\n`;
                      window.dispatchEvent(new CustomEvent('insert-editor-text', { detail: { text } }));
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 bg-gray-800/80 backdrop-blur border border-gray-700 rounded hover:bg-gray-700 hover:text-indigo-300 transition-colors shadow-sm"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Insert at Cursor
                  </button>
                </div>
              )}
              <MermaidRenderer
                chartDefinition={chartCode}
                repairStatus={repairStatus}
                onSyntaxErrorDetected={(err) =>
                  handleSyntaxError(chartCode, err, mermaidSeg.index)
                }
              />
            </div>
          );
        })}
        {(message.modelUsed || message.estimatedCost !== undefined) && !isStreaming && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/30 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {message.modelUsed}
            </div>
            {message.estimatedCost !== undefined && (
              <span className="font-mono">${message.estimatedCost.toFixed(4)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
