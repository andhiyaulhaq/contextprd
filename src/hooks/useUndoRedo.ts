import { useStore } from 'zustand';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export function useUndoRedo() {
  const undo = useStore(useWorkspaceStore.temporal, (s) => s.undo);
  const redo = useStore(useWorkspaceStore.temporal, (s) => s.redo);
  const clear = useStore(useWorkspaceStore.temporal, (s) => s.clear);
  const canUndo = useStore(useWorkspaceStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useWorkspaceStore.temporal, (s) => s.futureStates.length > 0);

  return { undo, redo, clear, canUndo, canRedo };
}
