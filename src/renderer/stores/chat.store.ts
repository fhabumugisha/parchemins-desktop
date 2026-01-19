import { create } from 'zustand';
import type { ChatResponse } from '@shared/types';
import { getErrorMessage } from '../lib/error';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: number; title: string; snippet: string }>;
  timestamp: Date;
  isError?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isApiConfigured: boolean;

  sendMessage: (content: string, referencedDocumentIds?: number[]) => Promise<void>;
  clearChat: () => void;
  checkApiConfiguration: () => Promise<void>;
  summarizeDocument: (documentId: number, documentTitle: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isApiConfigured: false,

  sendMessage: async (content, referencedDocumentIds = []) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const history = get()
        .messages.filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response: ChatResponse = await window.electronAPI.chat.send(content, history, referencedDocumentIds);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
        isError: true,
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        error: errorMsg,
        isLoading: false,
      }));
    }
  },

  clearChat: () => {
    set({ messages: [], error: null });
  },

  checkApiConfiguration: async () => {
    try {
      const isConfigured = await window.electronAPI.chat.isConfigured();
      set({ isApiConfigured: isConfigured });
    } catch {
      set({ isApiConfigured: false });
    }
  },

  summarizeDocument: async (documentId, documentTitle) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `Resume mon sermon "${documentTitle}"`,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const summary = await window.electronAPI.chat.summarize(documentId);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summary,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error),
        isLoading: false,
      });
    }
  },
}));
