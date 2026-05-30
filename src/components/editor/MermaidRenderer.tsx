'use client';

import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useSettingsStore } from '../../store/useSettingsStore';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

interface MermaidRendererProps {
  chartDefinition: string;
  onSyntaxErrorDetected: (errorString: string) => void;
  repairStatus?: 'idle' | 'repairing' | 'dead';
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chartDefinition,
  onSyntaxErrorDetected,
  repairStatus = 'idle',
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  
  const themeSetting = useSettingsStore((s) => s.theme);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  // Subscribe to the browser's theme preference (valid useEffect usage)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Derive the active theme synchronously (no double rendering)
  const activeTheme = themeSetting === 'system' 
    ? (systemPrefersDark ? 'dark' : 'light') 
    : themeSetting;

  useEffect(() => {
    if (repairStatus === 'dead') return;
    if (repairStatus === 'repairing') return;

    const validateAndRenderChart = async () => {
      try {
        setHasError(false);
        setSvgContent('');
        const elementId = `mermaid-render-${Math.random().toString(36).substring(2, 9)}`;

        mermaid.initialize({
          startOnLoad: false,
          theme: activeTheme === 'light' ? 'default' : 'dark',
          securityLevel: 'loose',
        });

        const isValid = await mermaid.parse(chartDefinition);

        if (isValid) {
          const { svg } = await mermaid.render(elementId, chartDefinition);
          setSvgContent(svg);
        }
      } catch (error: any) {
        setHasError(true);
        onSyntaxErrorDetected(error.message || 'Syntax parsing failed unexpectedly.');
      }
    };

    if (chartDefinition) {
      validateAndRenderChart();
    }
  }, [chartDefinition, repairStatus, onSyntaxErrorDetected, activeTheme]);

  if (repairStatus === 'dead') {
    return (
      <div className="p-4 border border-red-500/30 bg-red-950/20 rounded text-red-400 text-xs font-mono">
        Diagram generation failed. Please refine your request and try again.
      </div>
    );
  }

  if (repairStatus === 'repairing') {
    return (
      <div className="p-4 border border-amber-500/30 bg-amber-950/20 rounded text-amber-400 text-xs font-mono flex items-center gap-2">
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Repairing diagram...
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-950/20 rounded text-red-400 text-xs font-mono">
        Diagram parse error. Initiating self-repair...
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="p-4 rounded bg-gray-800/40 border border-gray-700/30 animate-pulse">
        <div className="h-4 bg-gray-700/40 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-700/30 rounded w-1/2 mb-2" />
        <div className="h-20 bg-gray-700/20 rounded" />
      </div>
    );
  }

  return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svgContent }} />;
};
