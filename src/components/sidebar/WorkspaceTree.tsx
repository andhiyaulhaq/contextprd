'use client';

import React from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { FileNode } from '../../types/workspace';

const FileIcon: React.FC<{ name: string; isDir: boolean }> = ({ name, isDir }) => {
  if (isDir) return <span className="text-xs opacity-60">{'\u{1F4C1}'}</span>;
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'md') return <span className="text-xs text-indigo-400">#</span>;
  return <span className="text-xs text-gray-600">{'\u{1F4C4}'}</span>;
};

export const WorkspaceTree: React.FC = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveFile = useWorkspaceStore((s) => s.setActiveFile);

  const workspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 text-xs px-4 text-center">
        <svg className="w-8 h-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        No workspace selected
      </div>
    );
  }

  if (workspace.fileTree.length === 0) {
    return (
      <div className="p-4 text-gray-600 text-xs text-center">
        Empty workspace
      </div>
    );
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isActive = node.id === workspace.activeFileId;
    const isDir = node.type === 'directory';

    return (
      <div key={node.id}>
        <button
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
            isActive
              ? 'bg-indigo-500/10 text-indigo-400 font-medium'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (!isDir) {
              setActiveFile(workspace.id, node.id);
            }
          }}
        >
          <FileIcon name={node.name} isDir={isDir} />
          <span className="truncate">{node.name}</span>
        </button>
        {node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-2 space-y-0.5">
      <div className="flex items-center gap-2 px-3 py-2">
        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {workspace.name}
        </span>
      </div>
      {workspace.fileTree.map((node) => renderNode(node))}
    </div>
  );
};
