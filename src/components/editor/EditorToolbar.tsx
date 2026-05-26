import React from 'react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      label: 'B',
      title: 'Bold',
      isActive: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'I',
      title: 'Italic',
      isActive: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'S',
      title: 'Strikethrough',
      isActive: editor.isActive('strike'),
      action: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: 'Code',
      title: 'Code',
      isActive: editor.isActive('code'),
      action: () => editor.chain().focus().toggleCode().run(),
    },
    { divider: true },
    {
      label: 'H1',
      title: 'Heading 1',
      isActive: editor.isActive('heading', { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: 'H2',
      title: 'Heading 2',
      isActive: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'H3',
      title: 'Heading 3',
      isActive: editor.isActive('heading', { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    { divider: true },
    {
      label: 'List',
      title: 'Bullet List',
      isActive: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Num',
      title: 'Ordered List',
      isActive: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Quote',
      title: 'Blockquote',
      isActive: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Code Block',
      title: 'Code Block',
      isActive: editor.isActive('codeBlock'),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-900 border-b border-gray-800">
      {buttons.map((btn, idx) => {
        if (btn.divider) {
          return <div key={`div-${idx}`} className="w-px h-5 bg-gray-700 mx-1" />;
        }
        return (
          <button
            key={btn.title}
            onClick={btn.action}
            title={btn.title}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              btn.isActive
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
};
