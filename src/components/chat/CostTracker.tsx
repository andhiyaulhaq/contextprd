'use client';

import React from 'react';
import { useSessionStore } from '../../store/useSessionStore';

export const CostTracker: React.FC = () => {
  const sessionCost = useSessionStore((s) => s.sessionCost);
  const costExceeded = sessionCost > 0.05;

  return (
    <div className="px-3 py-2 border-t border-gray-800 bg-gray-900/30">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Session
        </span>
        <span className={`text-xs font-mono ${costExceeded ? 'text-amber-400' : 'text-gray-500'}`}>
          ${sessionCost.toFixed(4)}
        </span>
      </div>
      {costExceeded && (
        <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-1">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Consider truncating context to reduce token usage
        </div>
      )}
    </div>
  );
};
