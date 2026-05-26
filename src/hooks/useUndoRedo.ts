import { useStore } from 'zustand';
import { useProjectStore } from '../store/useProjectStore';

export function useUndoRedo() {
  const undo = useStore(useProjectStore.temporal, (s) => s.undo);
  const redo = useStore(useProjectStore.temporal, (s) => s.redo);
  const clear = useStore(useProjectStore.temporal, (s) => s.clear);
  const canUndo = useStore(useProjectStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useProjectStore.temporal, (s) => s.futureStates.length > 0);

  return { undo, redo, clear, canUndo, canRedo };
}
