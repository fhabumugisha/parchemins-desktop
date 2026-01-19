import React, { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useCreditsStore } from '@/stores/credits.store';
import { useUIStore } from '@/stores/ui.store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeMessage } from './WelcomeMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { AlertTriangle, Search, Settings, MessageSquarePlus } from 'lucide-react';
import { messages as i18n } from '@shared/messages';

export function ChatPanel() {
  const { messages: chatMessages, isLoading, isApiConfigured, sendMessage, checkApiConfiguration, clearChat } = useChatStore();
  const { credits, fetchCredits } = useCreditsStore();
  const { setActiveView } = useUIStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  useEffect(() => {
    checkApiConfiguration();
    fetchCredits();
  }, [checkApiConfiguration, fetchCredits]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (content: string) => {
    if (!isApiConfigured) {
      return;
    }
    if (credits <= 0) {
      return;
    }
    await sendMessage(content);
    fetchCredits();
  };

  const handleNewChat = async () => {
    const confirmed = await confirm({
      title: i18n.chat.newChat,
      message: i18n.chat.confirmNewChat,
    });
    if (confirmed) {
      clearChat();
    }
  };

  if (!isApiConfigured) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gold mb-4" />
        <h2 className="text-xl font-serif text-burgundy mb-2">{i18n.chat.configRequired}</h2>
        <p className="text-muted mb-4 max-w-md">
          {i18n.chat.configRequiredDesc}
        </p>
        <Button onClick={() => setActiveView('settings')}>
          <Settings className="w-4 h-4 mr-2" />
          {i18n.chat.goToSettings}
        </Button>
        <div className="mt-6 flex items-center gap-2 text-sm text-muted">
          <Search className="w-4 h-4" />
          <span>{i18n.settings.credits.searchStillWorks}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cream">
      {chatMessages.length > 0 && (
        <div className="flex justify-end px-6 pt-4 pb-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-burgundy hover:bg-burgundy/5 rounded-lg transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            {i18n.chat.newChat}
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6">
        {chatMessages.length === 0 ? (
          <WelcomeMessage onSuggestionClick={handleSend} />
        ) : (
          <MessageList messages={chatMessages} />
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-muted mt-4">
            <LoadingSpinner size="sm" />
            <span>{i18n.chat.thinking}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {credits <= 10 && credits > 0 && (
        <div className="mx-6 mb-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg text-sm text-gold">
          {i18n.settings.credits.warning(credits)}
        </div>
      )}

      {credits <= 0 && (
        <div className="mx-6 mb-2 px-4 py-3 bg-cream border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-burgundy">{i18n.settings.credits.exhausted}</p>
              <p className="text-sm text-muted mt-1">{i18n.settings.credits.exhaustedDesc}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Search className="w-4 h-4" />
            <span>{i18n.settings.credits.searchStillWorks}</span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isLoading || credits <= 0} />
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
