import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { messages } from '@shared/messages';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={messages.chat.inputPlaceholder}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3',
          'focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          'transition-colors'
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className={cn(
          'p-3 rounded-xl bg-burgundy text-white',
          'hover:bg-burgundy/90 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
