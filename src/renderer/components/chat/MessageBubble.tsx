import { useState } from 'react';
import { User, Bot, AlertCircle, FileText, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/cn';
import { useDocumentsStore } from '@/stores/documents.store';
import { useUIStore } from '@/stores/ui.store';
import { messages } from '@shared/messages';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: number; title: string; snippet: string }>;
  timestamp: Date;
  isError?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { selectDocument } = useDocumentsStore();
  const { setActiveView } = useUIStore();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleSourceClick = async (sourceId: number) => {
    const doc = await window.electronAPI.documents.getById(sourceId);
    if (doc) {
      selectDocument(doc);
      setActiveView('document');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            message.isError ? 'bg-red-100' : 'bg-burgundy/10'
          )}
        >
          {message.isError ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Bot className="w-4 h-4 text-burgundy" />
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-[95%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-burgundy text-white'
            : message.isError
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-white shadow-sm border border-gray-100'
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div
            className={cn(
              'prose prose-sm max-w-none',
              'prose-p:my-2 prose-p:leading-relaxed',
              'prose-ul:my-2 prose-ol:my-2',
              'prose-li:my-0',
              'prose-headings:text-burgundy prose-headings:font-semibold',
              'prose-h1:text-lg prose-h2:text-base prose-h3:text-sm',
              'prose-strong:text-gray-900',
              'prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-burgundy',
              'prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded-lg',
              message.isError ? 'text-red-700' : 'text-gray-800'
            )}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-muted mb-2">{messages.chat.sourcesUsed}</p>
            <div className="space-y-1">
              {message.sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceClick(source.id)}
                  className="flex items-center gap-2 text-xs text-burgundy hover:underline"
                >
                  <FileText className="w-3 h-3" />
                  {source.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={cn('flex items-center justify-between mt-2', isUser ? 'text-white/70' : 'text-muted')}>
          <span className="text-xs">
            {message.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {!isUser && !message.isError && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs hover:text-burgundy transition-colors"
              title={messages.common.copy}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">{messages.common.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{messages.common.copy}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gold" />
        </div>
      )}
    </div>
  );
}
