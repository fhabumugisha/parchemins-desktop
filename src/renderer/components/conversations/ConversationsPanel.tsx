import React, { useEffect } from 'react';
import { X, History } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useConversationsStore } from '@/stores/conversations.store';
import { useChatStore } from '@/stores/chat.store';
import { useUIStore } from '@/stores/ui.store';
import { ConversationItem } from './ConversationItem';

export function ConversationsPanel() {
  const { conversations, fetchConversations, loadConversation, deleteConversation, updateTitle } =
    useConversationsStore();
  const { loadFromConversation, currentConversationId, clearChat } = useChatStore();
  const { conversationsPanelOpen, setConversationsPanelOpen } = useUIStore();

  useEffect(() => {
    if (conversationsPanelOpen) {
      fetchConversations();
    }
  }, [conversationsPanelOpen, fetchConversations]);

  const handleSelectConversation = async (id: number) => {
    const messages = await loadConversation(id);
    loadFromConversation(id, messages);
  };

  const handleDeleteConversation = async (id: number) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      clearChat();
    }
  };

  const handleRenameConversation = async (id: number, title: string) => {
    await updateTitle(id, title);
  };

  if (!conversationsPanelOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'h-full bg-white border-l border-gray-200 flex flex-col',
        'w-80 flex-shrink-0'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-burgundy" />
          <h2 className="font-semibold text-gray-800">Conversations</h2>
        </div>
        <button
          onClick={() => setConversationsPanelOpen(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <History className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucune conversation sauvegardee</p>
            <p className="text-xs text-gray-400 mt-1">
              Sauvegardez vos conversations pour les retrouver ici
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversationId === conversation.id}
                onSelect={() => handleSelectConversation(conversation.id)}
                onDelete={() => handleDeleteConversation(conversation.id)}
                onRename={(title) => handleRenameConversation(conversation.id, title)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
