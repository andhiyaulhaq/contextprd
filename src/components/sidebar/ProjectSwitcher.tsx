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

// Category Icon components
const CategoryIcon: React.FC<{ category: DomainCategory; className?: string }> = ({ category, className = "w-4 h-4" }) => {
  switch (category) {
    case 'WEB_APP':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'NATIVE_DESKTOP':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'MOBILE_APP':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'GENERAL_SAAS':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
  }
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

    if (!description.trim()) {
      onClose();
      return;
    }

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
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">New Project</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSeeding ? 'Personalizing your project files with AI…' : 'Create a new PRD project'}
          </p>
        </div>

        {isSeeding ? (
          <div className="p-5 space-y-5">
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border cursor-pointer transition-all active:scale-[0.98] ${category === cat.value
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">
                  Description
                  <span className="ml-1 text-gray-600 font-normal">(optional)</span>
                </label>
                <span className={`text-xs tabular-nums ${description.length > 450 ? 'text-amber-500' : 'text-gray-600'
                  }`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project — AI will use this to seed your templates."
                className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
              />
            </div>

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
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogWsId, setDeleteDialogWsId] = useState<string | null>(null);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const streamingMessageId = useSessionStore((s) => s.streamingMessageId);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  const projectList = Object.values(projects);
  const isStreaming = streamingMessageId !== null;

  // Handle outside clicks to close the dropdown popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Focus rename input when editing starts
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

  // Filter projects by name
  const filteredProjects = projectList.filter((p) =>
    p.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      <div className="p-3 border-b border-gray-800 relative" ref={dropdownRef}>
        {/* Switcher Header/Trigger */}
        <div className="flex items-center">
          <button
            onClick={() => setIsDropdownOpen((o) => !o)}
            className="flex items-center gap-2 hover:bg-gray-800/80 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer text-left flex-1 min-w-0 active:scale-[0.98] select-none"
          >
            {activeProject ? (
              <>
                <div className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <CategoryIcon category={activeProject.profile.category} className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-200 truncate leading-none mb-1">
                    {activeProject.name}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-none uppercase tracking-wider">
                    {CATEGORY_LABELS[activeProject.profile.category]}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 font-medium">Select project...</span>
            )}
            <svg className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dropdown Popover */}
        {isDropdownOpen && (
          <div className="absolute top-[calc(100%-4px)] left-3 right-3 z-50 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl py-2 mt-1 flex flex-col max-h-[350px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Search Input */}
            <div className="px-2 pb-2 border-b border-gray-800/80">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50 transition-colors"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  No projects found
                </div>
              ) : (
                filteredProjects.map((ws) => {
                  const isActive = ws.id === activeProjectId;
                  const isEditing = editingId === ws.id;
                  const canDelete = !(isStreaming && isActive);

                  return (
                    <div
                      key={ws.id}
                      onClick={() => {
                        if (!isEditing) {
                          setActiveProject(ws.id);
                          setIsDropdownOpen(false); // Switch closes switcher immediately (industry standard)
                        }
                      }}
                      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${isActive
                          ? 'bg-indigo-500/10 text-indigo-200'
                          : 'text-gray-300 hover:bg-gray-800/60'
                        }`}
                    >
                      <CategoryIcon category={ws.profile.category} className="w-3.5 h-3.5 opacity-60" />

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
                            className="w-full bg-gray-850 text-gray-200 rounded px-1.5 py-0.5 border border-indigo-500/40 outline-none text-xs -ml-1"
                          />
                        ) : (
                          <span className="block text-xs truncate font-medium">
                            {ws.name}
                          </span>
                        )}
                      </div>

                      {/* Row actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => handleStartRename(e, ws.id, ws.name)}
                            className="p-1 rounded text-gray-500 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
                            title="Rename"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, ws.id)}
                            disabled={!canDelete}
                            className={`p-1 rounded transition-colors ${!canDelete ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-rose-400 hover:bg-gray-800'
                              }`}
                            title={!canDelete ? 'Cannot delete while AI is streaming' : 'Delete'}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer Actions */}
            <div className="p-1 px-2 border-t border-gray-800/80 bg-gray-950/20">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setShowCreateDialog(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 rounded-lg transition-colors cursor-pointer select-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateDialog && <CreateProjectDialog onClose={() => setShowCreateDialog(false)} />}
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
