'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useProjectSeeder } from '../../hooks/useProjectSeeder';
import { DomainCategory } from '../../types/project';

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

const CreateProjectDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createProject = useProjectStore((s) => s.createProject);
  const { seedProject } = useProjectSeeder();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DomainCategory>('WEB_APP');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ phase: 'manifest' | 'files'; done: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Project name is required');
      return;
    }

    const projectId = createProject(trimmed, category, description.trim());

    // No description — use static template immediately (existing behaviour)
    if (!description.trim()) {
      onClose();
      return;
    }

    // Description provided — run the two-phase AI seeding
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSeeding(true);

    try {
      await seedProject(
        projectId,
        description.trim(),
        (progress) => setSeedProgress(progress),
        controller.signal,
      );
    } catch {
      // Aborted or errored — project still exists with static template
    } finally {
      setIsSeeding(false);
      abortRef.current = null;
      onClose();
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsSeeding(false);
    onClose();
  };

  const hasDescription = description.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">New Project</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSeeding ? 'Personalizing your project files with AI…' : 'Create a new PRD project'}
          </p>
        </div>

        {/* ── Seeding Progress View ── */}
        {isSeeding ? (
          <div className="p-5 space-y-5">

            {/* Phase indicator */}
            {seedProgress?.phase === 'manifest' ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                <span className="text-sm text-gray-300">✦ Generating project manifest…</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                    <span className="text-sm text-gray-300">Generating files…</span>
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">
                    {seedProgress?.done ?? 0} / {seedProgress?.total ?? 0}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${seedProgress && seedProgress.total > 0
                        ? Math.round((seedProgress.done / seedProgress.total) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className="w-full px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:text-gray-200 hover:border-gray-600 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        ) : (

        /* ── Form View ── */
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Name */}
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

          {/* Domain */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Domain</label>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border cursor-pointer transition-all active:scale-[0.98] ${
                    category === cat.value
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

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">
                Description
                <span className="ml-1 text-gray-600 font-normal">(optional)</span>
              </label>
              <span className={`text-xs tabular-nums ${
                description.length > 450 ? 'text-amber-500' : 'text-gray-600'
              }`}>
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project — the AI will use this to personalize your starter files. Leave blank to use the default template."
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
            />
            {hasDescription && (
              <p className="text-xs text-indigo-400/70 mt-1">
                ✦ AI will personalize your starter files using this description.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:text-gray-200 hover:border-gray-600 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-500 transition-all active:scale-[0.98]"
            >
              {hasDescription ? 'Create & Generate ✦' : 'Create'}
            </button>
          </div>
        </form>
        )}

      </div>
    </div>
  );
};


const DeleteProjectDialog: React.FC<{
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ projectName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">Delete Project</h2>
          <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to delete the project <strong className="text-gray-100">{projectName}</strong>?
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:text-gray-200 hover:border-gray-600 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg cursor-pointer hover:bg-rose-500 transition-all active:scale-[0.98]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectSwitcher: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogWsId, setDeleteDialogWsId] = useState<string | null>(null);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
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
    if (trimmed && trimmed !== projects[wsId]?.name) {
      renameProject(wsId, trimmed);
    }
    setEditingId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    setDeleteDialogWsId(wsId);
  };

  const handleConfirmDelete = () => {
    if (deleteDialogWsId) {
      deleteProject(deleteDialogWsId);
      setDeleteDialogWsId(null);
    }
  };

  const projectList = Object.values(projects);
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
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</span>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all hover:scale-105 active:scale-95"
            title="New Project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Project List */}
        {projectList.length === 0 ? (
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowDialog(true)}
              className="w-full py-6 rounded-lg border border-dashed border-gray-700 cursor-pointer text-gray-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-xs text-center active:scale-[0.98]"
            >
              <svg className="w-6 h-6 mx-auto mb-1.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create your first project
            </button>
          </div>
        ) : (
          <div className="px-1.5 pb-2 space-y-0.5">
            {projectList.map((ws) => {
              const isActive = ws.id === activeProjectId;
              const isEditing = editingId === ws.id;
              const canDelete = !(isStreaming && isActive);

              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveProject(ws.id);
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
                        className="p-1.5 rounded cursor-pointer text-gray-500 hover:text-indigo-400 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
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
                        className={`p-1.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 ${
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
      {showDialog && <CreateProjectDialog onClose={() => setShowDialog(false)} />}
      {deleteDialogWsId && (
        <DeleteProjectDialog
          projectName={projects[deleteDialogWsId]?.name || ''}
          onClose={() => setDeleteDialogWsId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};
