import React from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { MermaidRenderer } from './MermaidRenderer';

export const CodeBlockNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, extension }) => {
  const isMermaid = node.attrs.language === 'mermaid';

  const [showCode, setShowCode] = React.useState(true);

  const onSyntaxError = (err: string) => {
    console.error('Mermaid error in editor:', err);
  };

  return (
    <NodeViewWrapper className={`relative ${isMermaid ? 'mermaid-wrapper' : 'code-wrapper'}`}>
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2" contentEditable={false}>
        {isMermaid && (
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-[10px] uppercase tracking-wider font-semibold bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700 rounded px-2 py-0.5 cursor-pointer transition-colors"
          >
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
        )}
        <select
          className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-1 py-0.5 outline-none cursor-pointer"
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
      </div>

      <div className={`pt-4 pb-2 ${isMermaid && showCode ? 'flex flex-row gap-4 items-stretch' : ''}`}>
        {isMermaid && (
          <div contentEditable={false} className={`min-w-0 ${showCode ? 'w-1/2 shrink-0 border-r border-gray-800/50 pr-4 py-3' : 'w-full py-3'}`}>
            <MermaidRenderer
              chartDefinition={node.textContent.replace(/\u00A0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '')}
              onSyntaxErrorDetected={onSyntaxError}
            />
          </div>
        )}

        <pre
          className={`margin-0 m-0 ${!showCode && isMermaid ? 'hidden' : ''} ${isMermaid && showCode ? 'w-1/2 shrink-0 bg-gray-900/50 text-gray-300 text-xs p-3 rounded-lg overflow-auto max-h-[500px] border border-gray-800' : 'mt-2'}`}
        >
          <code className="block min-w-full">
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};
