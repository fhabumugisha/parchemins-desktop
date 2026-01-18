import React, { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useCreditsStore } from '@/stores/credits.store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeMessage } from './WelcomeMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { messages as i18n } from '@shared/messages';

export function ChatPanel() {
  const { messages: chatMessages, isLoading, isApiConfigured, sendMessage, checkApiConfiguration } = useChatStore();
  const { credits, fetchCredits } = useCreditsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  if (!isApiConfigured) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gold mb-4" />
        <h2 className="text-xl font-serif text-burgundy mb-2">{i18n.chat.configRequired}</h2>
        <p className="text-muted mb-4 max-w-md">
          {i18n.chat.configRequiredDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cream">
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
        <div className="mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {i18n.settings.credits.exhausted}
        </div>
      )}

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isLoading || credits <= 0} />
        </div>
      </div>
    </div>
  );
}
