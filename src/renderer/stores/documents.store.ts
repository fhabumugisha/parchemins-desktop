import { create } from "zustand";
import type { Document } from "@shared/types";
import { getErrorMessage } from "../lib/error";

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
  updateDocumentTitle: (id: number, title: string) => Promise<boolean>;
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
      set({ error: getErrorMessage(error), isLoading: false });
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
      set({ error: getErrorMessage(error) });
    }
  },

  openDocumentExternal: async (id) => {
    try {
      await window.electronAPI.documents.openExternal(id);
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  updateDocumentTitle: async (id, title) => {
    try {
      const result = await window.electronAPI.documents.updateTitle(id, title);
      if (result.success) {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, title } : d
          ),
          selectedDocument:
            state.selectedDocument?.id === id
              ? { ...state.selectedDocument, title }
              : state.selectedDocument,
          searchResults: state.searchResults.map((d) =>
            d.id === id ? { ...d, title } : d
          ),
        }));
        return true;
      }
      return false;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
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
      set({ error: getErrorMessage(error), isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },
}));
