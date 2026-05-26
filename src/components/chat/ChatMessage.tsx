'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types/workspace';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onDelete?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, onDelete }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const displayContent = message.content + (isStreaming ? '\u258C' : '');

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
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/15'
            : isSystem
            ? 'bg-gray-800/50 text-gray-500 text-xs italic border border-gray-800'
            : 'bg-gray-800/60 text-gray-300 border border-gray-700/50'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{displayContent}</div>
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
