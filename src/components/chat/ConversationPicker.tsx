'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useConversationStore } from '../../store/useConversationStore';

interface ConversationPickerProps {
  workspaceId: string;
}

export const ConversationPicker: React.FC<ConversationPickerProps> = ({ workspaceId }) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogConvId, setDeleteDialogConvId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const switchConversation = useConversationStore((s) => s.switchConversation);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const renameConversation = useConversationStore((s) => s.renameConversation);
  const allConversations = useConversationStore((s) => s.conversations);

  const conversations = React.useMemo(() => {
    return Object.values(allConversations)
      .filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [allConversations, workspaceId]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
        setDeleteDialogConvId(null);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (convId: string) => {
    if (convId !== activeConversationId) {
      switchConversation(convId);
    }
    setOpen(false);
  };

  const handleStartRename = (e: React.MouseEvent, convId: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(convId);
    setEditName(currentName);
  };

  const handleFinishRename = (convId: string) => {
    if (editName.trim()) {
      renameConversation(convId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setDeleteDialogConvId(convId);
  };

  const handleConfirmDelete = () => {
    if (deleteDialogConvId) {
      deleteConversation(deleteDialogConvId);
      setDeleteDialogConvId(null);
      // Wait a moment for the state to update, but close immediately
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left text-xs text-gray-400 hover:text-gray-300 truncate bg-gray-800/40 rounded px-2 py-1 border border-gray-700/40 hover:border-gray-600/50 hover:bg-gray-800/80 active:scale-[0.98] transition-all"
        title={activeConv?.name || 'No conversation'}
      >
        {activeConv?.name || 'Conversation'}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-500 text-center">No conversations</div>
          )}
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={`group flex items-center gap-1 px-3 py-2 cursor-pointer text-xs transition-all ${isActive
                    ? 'bg-indigo-500/10 text-indigo-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
              >
                {editingId === conv.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleFinishRename(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(conv.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="flex-1 bg-gray-800 text-gray-200 rounded px-1.5 py-0.5 border border-indigo-500/40 outline-none text-xs"
                  />
                ) : (
                  <span className="flex-1 truncate">{conv.name}</span>
                )}

                {editingId !== conv.id && (
                  <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(e, conv.id, conv.name)}
                      className="p-1 rounded text-gray-500 hover:text-indigo-400 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all"
                      title="Rename"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, conv.id)}
                      className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {deleteDialogConvId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-200">Delete Conversation</h2>
              <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-300">
                Are you sure you want to delete <strong className="text-gray-100">{allConversations[deleteDialogConvId]?.name}</strong>?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteDialogConvId(null)}
                  className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-700 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20 transition-all active:scale-[0.98]"
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
