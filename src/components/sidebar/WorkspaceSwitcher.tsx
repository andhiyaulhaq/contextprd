'use client';

import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { DomainCategory } from '../../types/workspace';

const CATEGORIES: { value: DomainCategory; label: string; desc: string }[] = [
  { value: 'WEB_APP', label: 'Web App', desc: 'Browser-based SaaS application' },
  { value: 'NATIVE_DESKTOP', label: 'Desktop App', desc: 'Native OS application' },
  { value: 'MOBILE_APP', label: 'Mobile App', desc: 'iOS / Android application' },
  { value: 'GENERAL_SAAS', label: 'General SaaS', desc: 'Multi-tenant cloud service' },
];

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
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${
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

export const WorkspaceSwitcher: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  return (
    <>
      <div className="p-3 border-b border-gray-800 space-y-2">
        <div className="flex items-center gap-2">
          <select
            className="flex-1 bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
            value={activeWorkspaceId || ''}
            onChange={(e) => setActiveWorkspace(e.target.value)}
          >
            <option value="" disabled>Select workspace</option>
            {Object.values(workspaces).map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowDialog(true)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
            title="New workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      {showDialog && <CreateWorkspaceDialog onClose={() => setShowDialog(false)} />}
    </>
  );
};
