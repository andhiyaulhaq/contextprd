import React, { useMemo } from 'react';

export interface TocItem {
  text: string;
  level: number;
  line: number;
  index: number;
}

interface TableOfContentsProps {
  content: string;
  onNavigate: (index: number, line: number) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content, onNavigate }) => {
  const tocItems = useMemo(() => {
    const lines = content.split('\n');
    const items: TocItem[] = [];
    let headingIndex = 0;
    
    lines.forEach((line, i) => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        items.push({
          text: match[2].trim(),
          level: match[1].length,
          line: i + 1,
          index: headingIndex
        });
        headingIndex++;
      }
    });
    
    return items;
  }, [content]);

  if (tocItems.length === 0) return null;

  return (
    <div className="absolute top-16 right-4 z-50 flex items-start group h-[calc(100%-4rem)] pointer-events-none">
      {/* Invisible hover trigger zone extending left */}
      <div className="absolute inset-y-0 right-0 w-12 bg-transparent z-10 pointer-events-auto" />
      
      {/* The actual expanding panel */}
      <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 ease-out bg-gray-900/95 backdrop-blur-md border border-gray-800 shadow-2xl rounded-xl p-4 w-64 max-h-[80vh] overflow-y-auto relative z-20">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">On this page</h3>
        <div className="flex flex-col gap-2">
          {tocItems.map((item) => (
            <button
              key={`${item.line}-${item.index}`}
              onClick={() => onNavigate(item.index, item.line)}
              className={`text-left text-sm truncate hover:text-indigo-400 transition-colors cursor-pointer ${
                item.level === 1 ? 'text-gray-200 font-medium' :
                item.level === 2 ? 'text-gray-400 ml-3' : 'text-gray-500 ml-6 text-xs'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
      
      {/* Subtle indicator when collapsed */}
      <div className="absolute right-0 top-1/4 w-1.5 h-12 bg-gray-700/50 rounded-full group-hover:opacity-0 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
