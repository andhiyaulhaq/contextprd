'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useSessionStore } from '../../store/useSessionStore';
import { DomainCategory } from '../../types/workspace';

const CATEGORIES: { value: DomainCategory; label: string; desc: string }[] = [
  { value: 'WEB_APP', label: 'Web App', desc: 'Browser-based SaaS application' },
  { value: 'NATIVE_DESKTOP', label: 'Desktop App', desc: 'Native OS application' },
  { value: 'MOBILE_APP', label: 'Mobile App', desc: 'iOS / Android application' },
  { value: 'GENERAL_SAAS', label: 'General SaaS', desc: 'Multi-tenant cloud service' },
];

const CATEGORY_LABELS: Record<DomainCategory, string> = {
  WEB_APP: 'Web App',
  NATIVE_DESKTOP: 'Desktop',
  MOBILE_APP: 'Mobile',
  GENERAL_SAAS: 'SaaS',
};

const CreateWorkspaceDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DomainCategory>('WEB_APP');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Workspace name is required');
      return;
    }
    createWorkspace(trimmed, category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">New Workspace</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create a new PRD workspace</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. My SaaS Platform"
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Domain</label>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${category === cat.value
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                >
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs opacity-70">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 hover:text-gray-200 hover:border-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteWorkspaceDialog: React.FC<{
  workspaceName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ workspaceName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">Delete Workspace</h2>
          <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to delete the workspace <strong className="text-gray-100">{workspaceName}</strong>?
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 hover:text-gray-200 hover:border-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WorkspaceSwitcher: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogWsId, setDeleteDialogWsId] = useState<string | null>(null);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const streamingMessageId = useSessionStore((s) => s.streamingMessageId);

  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus the rename input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (e: React.MouseEvent, wsId: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(wsId);
    setEditName(currentName);
  };

  const handleFinishRename = (wsId: string) => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== workspaces[wsId]?.name) {
      renameWorkspace(wsId, trimmed);
    }
    setEditingId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    setDeleteDialogWsId(wsId);
  };

  const handleConfirmDelete = () => {
    if (deleteDialogWsId) {
      deleteWorkspace(deleteDialogWsId);
      setDeleteDialogWsId(null);
    }
  };

  const workspaceList = Object.values(workspaces);
  const isStreaming = streamingMessageId !== null;

  return (
    <>
      <div className="border-b border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Workspaces</span>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
            title="New workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Workspace List */}
        {workspaceList.length === 0 ? (
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowDialog(true)}
              className="w-full py-6 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-xs text-center"
            >
              <svg className="w-6 h-6 mx-auto mb-1.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="px-1.5 pb-2 space-y-0.5">
            {workspaceList.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              const isEditing = editingId === ws.id;
              const canDelete = !(isStreaming && isActive);

              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveWorkspace(ws.id);
                    }
                  }}
                  className={`group relative flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                      : 'border-l-2 border-transparent hover:bg-gray-800/60'
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleFinishRename(ws.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRename(ws.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-gray-800 text-gray-200 rounded px-1.5 py-0.5 border border-indigo-500/40 outline-none text-sm -ml-1.5"
                      />
                    ) : (
                      <span className={`block text-sm truncate ${isActive ? 'text-indigo-300 font-medium' : 'text-gray-300'}`}>
                        {ws.name}
                      </span>
                    )}
                    <span className="block text-[10px] uppercase tracking-wider text-gray-600 mt-0.5">
                      {CATEGORY_LABELS[ws.profile.category] || ws.profile.category}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {!isEditing && (
                    <span className="flex items-center gap-1 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Rename */}
                      <button
                        onClick={(e) => handleStartRename(e, ws.id, ws.name)}
                        className="p-1.5 rounded text-gray-500 hover:text-indigo-400 hover:bg-gray-800 transition-all"
                        title="Rename"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={(e) => handleDeleteClick(e, ws.id)}
                        disabled={!canDelete}
                        className={`p-1.5 rounded transition-all ${
                          !canDelete
                            ? 'text-gray-700 cursor-not-allowed'
                            : 'text-gray-500 hover:text-rose-400 hover:bg-gray-800'
                        }`}
                        title={
                          !canDelete
                            ? 'Cannot delete while AI is streaming'
                            : 'Delete'
                        }
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showDialog && <CreateWorkspaceDialog onClose={() => setShowDialog(false)} />}
      {deleteDialogWsId && (
        <DeleteWorkspaceDialog
          workspaceName={workspaces[deleteDialogWsId]?.name || ''}
          onClose={() => setDeleteDialogWsId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};
