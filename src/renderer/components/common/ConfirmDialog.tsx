import React, { useEffect, useCallback } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { messages } from '@shared/messages';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const Icon = variant === 'danger' ? AlertTriangle : HelpCircle;
  const iconBgColor = variant === 'danger' ? 'bg-red-100' : 'bg-burgundy/10';
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-burgundy';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>

          {/* Content */}
          <h2 className="text-lg font-medium text-gray-900 text-center mb-2">{title}</h2>
          <p className="text-muted text-center mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel || messages.common.cancel}
            </Button>
            <Button
              onClick={onConfirm}
              className={
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600'
                  : ''
              }
            >
              {confirmLabel || messages.common.confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
