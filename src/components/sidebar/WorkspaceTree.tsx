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
  const createFile = useWorkspaceStore((s) => s.createFile);
  const renameFile = useWorkspaceStore((s) => s.renameFile);
  const deleteFile = useWorkspaceStore((s) => s.deleteFile);
  const updateFileContent = useWorkspaceStore((s) => s.updateFileContent);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [isNewFileId, setIsNewFileId] = React.useState<string | null>(null);
  const [deleteDialogFile, setDeleteDialogFile] = React.useState<{ id: string, name: string } | null>(null);

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
        <div
          className={`group flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-all ${
            isActive
              ? 'bg-indigo-500/10 text-indigo-400 font-medium'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (!isDir && editingId !== node.id) {
              setActiveFile(workspace.id, node.id);
            }
          }}
        >
          <FileIcon name={node.name} isDir={isDir} />
          
          {editingId === node.id ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => {
                const val = e.target.value;
                setEditName(val);
                
                const rawName = node.name.replace(/\.md$/i, '');
                const isOnlyH1 = node.content.trim() === '' || node.content.trim() === `# ${rawName}`;
                
                if (isNewFileId === node.id || isOnlyH1) {
                  const finalName = val.trim() ? (val.trim().endsWith('.md') ? val.trim() : `${val.trim()}.md`) : 'new_file.md';
                  renameFile(workspace.id, node.id, finalName);
                  const displayTitle = val.trim().replace(/\.md$/i, '') || 'new_file';
                  updateFileContent(workspace.id, node.id, `# ${displayTitle}\n\n`);
                }
              }}
              onBlur={() => {
                if (editName.trim() && editName.trim() !== node.name && isNewFileId !== node.id) {
                  renameFile(workspace.id, node.id, editName.trim().endsWith('.md') ? editName.trim() : `${editName.trim()}.md`);
                }
                setEditingId(null);
                setIsNewFileId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editName.trim() && editName.trim() !== node.name && isNewFileId !== node.id) {
                    renameFile(workspace.id, node.id, editName.trim().endsWith('.md') ? editName.trim() : `${editName.trim()}.md`);
                  }
                  setEditingId(null);
                  setIsNewFileId(null);
                }
                if (e.key === 'Escape') {
                  setEditingId(null);
                  setIsNewFileId(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-gray-800 text-gray-200 rounded px-1.5 py-0.5 border border-indigo-500/40 outline-none text-xs min-w-0"
            />
          ) : (
            <span className="flex-1 truncate">{node.name}</span>
          )}

          {!isDir && editingId !== node.id && (
            <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(node.id);
                  setEditName(node.name.replace(/\.md$/i, ''));
                }}
                className="p-1 rounded cursor-pointer text-gray-500 hover:text-indigo-400 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all"
                title="Rename"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogFile({ id: node.id, name: node.name });
                }}
                className="p-1 rounded cursor-pointer text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </span>
          )}
        </div>
        {node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-2 space-y-0.5">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
            {workspace.name}
          </span>
        </div>
        <button
          onClick={() => {
            const newId = createFile(workspace.id, 'new_file.md');
            if (newId) {
              setEditingId(newId);
              setEditName('new_file');
              setIsNewFileId(newId);
            }
          }}
          className="p-1 rounded-md text-gray-500 hover:text-indigo-400 hover:bg-gray-800 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
          title="New Markdown File"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {workspace.fileTree.map((node) => renderNode(node))}

      {deleteDialogFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-200">Delete File</h2>
              <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-300">
                Are you sure you want to delete <strong className="text-gray-100">{deleteDialogFile.name}</strong>?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteDialogFile(null)}
                  className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:text-gray-200 hover:border-gray-600 hover:bg-gray-700 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteFile(workspace.id, deleteDialogFile.id);
                    setDeleteDialogFile(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg cursor-pointer hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20 transition-all active:scale-[0.98]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
