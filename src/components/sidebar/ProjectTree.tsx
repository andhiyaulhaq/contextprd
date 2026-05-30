'use client';

import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { FileNode } from '../../types/project';
import { exportAsSingleFile, exportAsZip } from '../../lib/exportUtils';
import { ProjectSearchBar } from '../search/ProjectSearchBar';

const FileIcon: React.FC<{ name: string; isDir: boolean }> = ({ name, isDir }) => {
  if (isDir) {
    return (
      <svg className="w-4 h-4 text-amber-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  }
  
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'md') {
    return (
      <svg className="w-4 h-4 text-indigo-400/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2v7h7" />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
};

export const ProjectTree: React.FC = () => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const createFile = useProjectStore((s) => s.createFile);
  const renameFile = useProjectStore((s) => s.renameFile);
  const deleteFile = useProjectStore((s) => s.deleteFile);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [isNewFileId, setIsNewFileId] = React.useState<string | null>(null);
  const [deleteDialogFile, setDeleteDialogFile] = React.useState<{ id: string, name: string } | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    
    const handleToggleSearch = () => {
      setIsSearchOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    window.addEventListener('toggle-project-search', handleToggleSearch);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
      window.removeEventListener('toggle-project-search', handleToggleSearch);
    };
  }, []);

  React.useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openMenuId]);

  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const project = activeProjectId ? projects[activeProjectId] : null;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs px-4 text-center">
        <svg className="w-8 h-8 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        No project selected
      </div>
    );
  }

  if (project.fileTree.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-xs text-center">
        Empty project
      </div>
    );
  }

  const renderNode = (node: FileNode) => {
    const isActive = node.id === project.activeFileId;
    const isDir = node.type === 'directory';

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-2 px-2 py-1.5 text-[13px] cursor-pointer transition-all ${
            isActive
              ? 'bg-indigo-500/10 text-indigo-300 font-medium border-l-[3px] border-indigo-500 rounded-r-md -ml-px'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border-l-[3px] border-transparent rounded-r-md -ml-px'
          }`}
          onClick={() => {
            if (!isDir && editingId !== node.id) {
              setActiveFile(project.id, node.id);
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
                  renameFile(project.id, node.id, finalName);
                  const displayTitle = val.trim().replace(/\.md$/i, '') || 'new_file';
                  updateFileContent(project.id, node.id, `# ${displayTitle}\n\n`);
                }
              }}
              onBlur={() => {
                if (editName.trim() && editName.trim() !== node.name && isNewFileId !== node.id) {
                  renameFile(project.id, node.id, editName.trim().endsWith('.md') ? editName.trim() : `${editName.trim()}.md`);
                }
                setEditingId(null);
                setIsNewFileId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editName.trim() && editName.trim() !== node.name && isNewFileId !== node.id) {
                    renameFile(project.id, node.id, editName.trim().endsWith('.md') ? editName.trim() : `${editName.trim()}.md`);
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
            <div className="relative flex items-center shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === node.id ? null : node.id);
                }}
                className={`p-1 rounded cursor-pointer transition-all ${
                  openMenuId === node.id
                    ? 'text-indigo-400 bg-gray-800 opacity-100'
                    : 'text-gray-500 hover:text-indigo-400 hover:bg-gray-800 opacity-0 group-hover:opacity-100'
                }`}
                title="More Actions"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {openMenuId === node.id && (
                <div 
                  className="absolute right-0 top-6 w-32 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setEditingId(node.id);
                      setEditName(node.name.replace(/\.md$/i, ''));
                      setOpenMenuId(null);
                    }}
                    className="px-3 py-1.5 text-left text-[11px] text-gray-300 hover:text-indigo-300 hover:bg-gray-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadFile(node.name, node.content);
                      setOpenMenuId(null);
                    }}
                    className="px-3 py-1.5 text-left text-[11px] text-gray-300 hover:text-indigo-300 hover:bg-gray-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <div className="h-px bg-gray-800/80 my-0.5 mx-1" />
                  <button
                    onClick={() => {
                      setDeleteDialogFile({ id: node.id, name: node.name });
                      setOpenMenuId(null);
                    }}
                    className="px-3 py-1.5 text-left text-[11px] text-gray-300 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Render nested children with an indentation guide line */}
        {node.children && node.children.length > 0 && (
          <div className="ml-3 pl-1.5 border-l border-gray-800/80">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 space-y-0.5">
      {/* Utility Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-1">
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest select-none">
          Files
        </span>
        <div className="flex items-center gap-0.5 relative">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-400 hover:bg-gray-800 cursor-pointer transition-all shrink-0 active:scale-95"
            title="Search Workspace (Cmd+K)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-400 hover:bg-gray-800 cursor-pointer transition-all shrink-0 active:scale-95"
            title="Export Project"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          {isDownloadMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDownloadMenuOpen(false)}
              />
              <div className="absolute right-0 top-7 w-48 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <button 
                  className="px-3 py-2 text-left text-xs text-gray-300 hover:text-indigo-300 hover:bg-gray-800 cursor-pointer flex items-center gap-2 transition-colors"
                  onClick={() => {
                    exportAsSingleFile(project);
                    setIsDownloadMenuOpen(false);
                  }}
                >
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 2v7h7" /></svg>
                  Single PRD (.md)
                </button>
                <button 
                  className="px-3 py-2 text-left text-xs text-gray-300 hover:text-amber-300 hover:bg-gray-800 cursor-pointer flex items-center gap-2 transition-colors"
                  onClick={() => {
                    exportAsZip(project);
                    setIsDownloadMenuOpen(false);
                  }}
                >
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  ZIP Archive (.zip)
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => {
              const newId = createFile(project.id, 'new_file.md');
              if (newId) {
                setEditingId(newId);
                setEditName('new_file');
                setIsNewFileId(newId);
              }
            }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-400 hover:bg-gray-800 cursor-pointer transition-all active:scale-95 shrink-0"
            title="New Markdown File"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-1">
        {project.fileTree.map((node) => renderNode(node))}
      </div>

      {deleteDialogFile && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
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
                  className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:text-gray-200 hover:border-gray-600 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteFile(project.id, deleteDialogFile.id);
                    setDeleteDialogFile(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg cursor-pointer hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <ProjectSearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}
    </div>
  );
};
