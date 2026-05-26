'use client';

import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

interface MermaidRendererProps {
  chartDefinition: string;
  onSyntaxErrorDetected: (errorString: string) => void;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chartDefinition, onSyntaxErrorDetected }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const validateAndRenderChart = async () => {
      try {
        setHasError(false);
        const elementId = `mermaid-render-${Math.random().toString(36).substring(2, 9)}`;

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
  }, [chartDefinition, onSyntaxErrorDetected]);

  if (hasError) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-950/20 rounded text-red-400 text-xs font-mono">
        [!] Critical Syntax Failure Caught: Suspending engine render pipeline to initialize self-repair routine.
      </div>
    );
  }

  if (!svgContent) {
    return <div className="p-4 text-gray-500 text-xs">Generating diagram...</div>;
  }

  return <div dangerouslySetInnerHTML={{ __html: svgContent }} />;
};
