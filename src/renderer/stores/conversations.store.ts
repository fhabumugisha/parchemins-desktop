import { create } from 'zustand';
import type { Conversation, Message } from '@shared/types';

interface ConversationsState {
  conversations: Conversation[];
  currentConversationId: number | null;
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<number>;
  loadConversation: (id: number) => Promise<Message[]>;
  deleteConversation: (id: number) => Promise<void>;
  updateTitle: (id: number, title: string) => Promise<void>;
  setCurrentConversationId: (id: number | null) => void;
  addMessageToConversation: (conversationId: number, role: 'user' | 'assistant', content: string, tokensUsed?: number) => Promise<void>;
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await window.electronAPI.conversations.getAll();
      set({ conversations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createConversation: async (title?: string) => {
    const id = await window.electronAPI.conversations.create(title);
    await get().fetchConversations();
    set({ currentConversationId: id });
    return id;
  },

  loadConversation: async (id: number) => {
    const messages = await window.electronAPI.conversations.getMessages(id);
    set({ currentConversationId: id });
    return messages;
  },

  deleteConversation: async (id: number) => {
    await window.electronAPI.conversations.delete(id);
    if (get().currentConversationId === id) {
      set({ currentConversationId: null });
    }
    await get().fetchConversations();
  },

  updateTitle: async (id: number, title: string) => {
    await window.electronAPI.conversations.updateTitle(id, title);
    await get().fetchConversations();
  },

  setCurrentConversationId: (id: number | null) => {
    set({ currentConversationId: id });
  },

  addMessageToConversation: async (conversationId: number, role: 'user' | 'assistant', content: string, tokensUsed?: number) => {
    await window.electronAPI.conversations.addMessage(conversationId, role, content, tokensUsed);
  },
}));
