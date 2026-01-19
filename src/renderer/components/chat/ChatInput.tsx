import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { messages } from '@shared/messages';
import { useDocumentsStore } from '@/stores/documents.store';
import type { Document } from '@shared/types';

interface ChatInputProps {
  onSend: (content: string, referencedDocumentIds: number[]) => void;
  disabled?: boolean;
}

interface SermonMention {
  id: number;
  title: string;
  startIndex: number;
  endIndex: number;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [mentions, setMentions] = useState<SermonMention[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const documents = useDocumentsStore((state) => state.documents);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === cursorPosition - 1) {
      setShowDropdown(true);
      setFilteredDocs(documents);
      setSelectedIndex(0);
    } else if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.substring(lastAtIndex + 1);
      if (!/\s/.test(afterAt)) {
        setShowDropdown(true);
        const filtered = documents.filter((doc) =>
          doc.title.toLowerCase().includes(afterAt.toLowerCase())
        );
        setFilteredDocs(filtered);
        setSelectedIndex(0);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
  }, [value, cursorPosition, documents]);

  const insertMention = (doc: Document) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) return;

    const beforeAt = value.substring(0, lastAtIndex);
    const mentionText = `@${doc.title}`;
    const newValue = beforeAt + mentionText + ' ' + afterCursor;
    const newCursorPos = lastAtIndex + mentionText.length + 1;

    setValue(newValue);
    setMentions([...mentions, {
      id: doc.id,
      title: doc.title,
      startIndex: lastAtIndex,
      endIndex: lastAtIndex + mentionText.length,
    }]);
    setShowDropdown(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      const mentionPattern = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
      const referencedIds: number[] = [];
      let match;

      while ((match = mentionPattern.exec(trimmed)) !== null) {
        const mentionTitle = match[1];
        const doc = documents.find((d) => d.title === mentionTitle);
        if (doc && !referencedIds.includes(doc.id)) {
          referencedIds.push(doc.id);
        }
      }

      onSend(trimmed, referencedIds);
      setValue('');
      setMentions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown && filteredDocs.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredDocs.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredDocs.length) % filteredDocs.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredDocs[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showDropdown) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  return (
    <div className="relative flex items-end gap-3">
      {showDropdown && filteredDocs.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-50"
        >
          {filteredDocs.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => insertMention(doc)}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors',
                index === selectedIndex && 'bg-burgundy/10'
              )}
            >
              <FileText className="w-4 h-4 text-burgundy flex-shrink-0" />
              <span className="text-sm truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
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
