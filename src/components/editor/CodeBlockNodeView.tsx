import React from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { MermaidRenderer } from './MermaidRenderer';

export const CodeBlockNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, extension }) => {
  const isMermaid = node.attrs.language === 'mermaid';

  const onSyntaxError = (err: string) => {
    console.error('Mermaid error in editor:', err);
  };

  return (
    <NodeViewWrapper className={`relative ${isMermaid ? 'mermaid-wrapper' : 'code-wrapper'}`}>
      <select
        contentEditable={false}
        className="absolute right-2 top-2 z-10 text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-1 py-0.5 outline-none"
        value={node.attrs.language || 'text'}
        onChange={(event) => updateAttributes({ language: event.target.value })}
      >
        <option value="null">auto</option>
        <option value="text">plain text</option>
        <option value="javascript">javascript</option>
        <option value="typescript">typescript</option>
        <option value="html">html</option>
        <option value="css">css</option>
        <option value="markdown">markdown</option>
        <option value="mermaid">mermaid</option>
      </select>

      {isMermaid && (
        <div contentEditable={false} className="mt-8 mb-2">
          <MermaidRenderer
            chartDefinition={node.textContent.replace(/\u00A0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '')}
            onSyntaxErrorDetected={onSyntaxError}
          />
        </div>
      )}

      <pre className={`mt-2 ${isMermaid ? 'bg-gray-900/50 text-gray-500/50 hover:text-gray-300 transition-colors text-xs p-2' : ''}`}>
        <code className="block">
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
};
