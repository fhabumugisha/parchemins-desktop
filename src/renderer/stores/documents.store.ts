import { create } from "zustand";
import type { Document } from "@shared/types";

interface DocumentsState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Document[];
  isSearching: boolean;

  // Actions
  fetchDocuments: () => Promise<void>;
  selectDocument: (doc: Document | null) => void;
  deleteDocument: (id: number) => Promise<void>;
  openDocumentExternal: (id: number) => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useDocumentsStore = create<DocumentsState>((set, _get) => ({
  documents: [],
  selectedDocument: null,
  isLoading: false,
  error: null,
  searchQuery: "",
  searchResults: [],
  isSearching: false,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = await window.electronAPI.documents.getAll();
      set({ documents, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectDocument: (doc) => {
    set({ selectedDocument: doc });
  },

  deleteDocument: async (id) => {
    try {
      await window.electronAPI.documents.delete(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        selectedDocument:
          state.selectedDocument?.id === id ? null : state.selectedDocument,
        searchResults: state.searchResults.filter((d) => d.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  openDocumentExternal: async (id) => {
    try {
      await window.electronAPI.documents.openExternal(id);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  search: async (query) => {
    set({ searchQuery: query, isSearching: true });

    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    try {
      const results = await window.electronAPI.search.query(query);
      set({ searchResults: results, isSearching: false });
    } catch (error) {
      set({ error: (error as Error).message, isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },
}));
