import React, { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useCreditsStore } from '@/stores/credits.store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeMessage } from './WelcomeMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

export function ChatPanel() {
  const { messages, isLoading, isApiConfigured, sendMessage, checkApiConfiguration } = useChatStore();
  const { credits, fetchCredits } = useCreditsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkApiConfiguration();
    fetchCredits();
  }, [checkApiConfiguration, fetchCredits]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        <h2 className="text-xl font-serif text-burgundy mb-2">Configuration requise</h2>
        <p className="text-muted mb-4 max-w-md">
          Pour utiliser l'assistant IA, vous devez configurer votre cle API Anthropic dans les parametres.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cream">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <WelcomeMessage onSuggestionClick={handleSend} />
        ) : (
          <MessageList messages={messages} />
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-muted mt-4">
            <LoadingSpinner size="sm" />
            <span>Reflexion en cours...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {credits <= 10 && credits > 0 && (
        <div className="mx-6 mb-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg text-sm text-gold">
          Attention : il vous reste seulement {credits} credit{credits > 1 ? 's' : ''}.
        </div>
      )}

      {credits <= 0 && (
        <div className="mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Credits epuises. Achetez des credits pour continuer a utiliser l'assistant.
        </div>
      )}

      <div className="border-t border-gray-200 bg-white p-4">
        <ChatInput onSend={handleSend} disabled={isLoading || credits <= 0} />
      </div>
    </div>
  );
}
