import { create } from "zustand";
import type { IndexingProgress, IndexingResult } from "@shared/types";

interface IndexerState {
  folderPath: string | null;
  isIndexing: boolean;
  progress: IndexingProgress | null;
  lastResult: IndexingResult | null;

  // Actions
  selectFolder: () => Promise<string | null>;
  indexFolder: (path: string) => Promise<void>;
  setFolderPath: (path: string) => void;
}

export const useIndexerStore = create<IndexerState>((set) => ({
  folderPath: null,
  isIndexing: false,
  progress: null,
  lastResult: null,

  selectFolder: async () => {
    const path = await window.electronAPI.indexer.selectFolder();
    if (path) {
      set({ folderPath: path });
    }
    return path;
  },

  indexFolder: async (path) => {
    set({ isIndexing: true, progress: null, lastResult: null });

    // Set up progress listener
    const unsubscribe = window.electronAPI.indexer.onProgress((progress) => {
      set({ progress });
    });

    try {
      const result = await window.electronAPI.indexer.indexFolder(path);
      set({ lastResult: result, isIndexing: false, progress: null });
    } catch (error) {
      set({ isIndexing: false, progress: null });
      throw error;
    } finally {
      unsubscribe();
    }
  },

  setFolderPath: (path) => set({ folderPath: path }),
}));
