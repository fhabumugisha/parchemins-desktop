import React, { useState } from 'react';
import { MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Conversation } from '@shared/types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      className={cn(
        'group px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-burgundy/10' : 'hover:bg-gray-100'
      )}
      onClick={isEditing ? undefined : onSelect}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className={cn(
          'w-4 h-4 mt-0.5 flex-shrink-0',
          isActive ? 'text-burgundy' : 'text-gray-400'
        )} />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 text-sm px-2 py-1 border border-burgundy/30 rounded focus:outline-none focus:ring-1 focus:ring-burgundy/50"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveTitle();
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className={cn(
                'text-sm font-medium truncate',
                isActive ? 'text-burgundy' : 'text-gray-700'
              )}>
                {conversation.title || 'Sans titre'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(conversation.updated_at)}
              </p>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 text-gray-400 hover:text-burgundy hover:bg-burgundy/10 rounded transition-colors"
              title="Renommer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
