import { create } from 'zustand';
import type { ChatResponse, Message } from '@shared/types';
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
  currentConversationId: number | null;

  sendMessage: (content: string, referencedDocumentIds?: number[]) => Promise<void>;
  clearChat: () => void;
  checkApiConfiguration: () => Promise<void>;
  summarizeDocument: (documentId: number, documentTitle: string) => Promise<void>;
  loadFromConversation: (conversationId: number, messages: Message[]) => void;
  saveCurrentChat: () => Promise<number | null>;
  setCurrentConversationId: (id: number | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isApiConfigured: false,
  currentConversationId: null,

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
    set({ messages: [], error: null, currentConversationId: null });
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

  loadFromConversation: (conversationId: number, messages: Message[]) => {
    const chatMessages: ChatMessage[] = messages.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
    }));
    set({ messages: chatMessages, currentConversationId: conversationId, error: null });
  },

  saveCurrentChat: async () => {
    const { messages, currentConversationId } = get();
    if (messages.length === 0) return null;

    const validMessages = messages.filter((m) => !m.isError);
    if (validMessages.length === 0) return null;

    const firstUserMessage = validMessages.find((m) => m.role === 'user');
    const title = firstUserMessage ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 'Conversation';

    if (currentConversationId) {
      return currentConversationId;
    }

    const conversationId = await window.electronAPI.conversations.create(title);
    for (const msg of validMessages) {
      await window.electronAPI.conversations.addMessage(conversationId, msg.role, msg.content);
    }
    set({ currentConversationId: conversationId });
    return conversationId;
  },

  setCurrentConversationId: (id: number | null) => {
    set({ currentConversationId: id });
  },
}));
