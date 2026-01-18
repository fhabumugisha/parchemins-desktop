import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// Simple toast store
let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function showToast(type: ToastType, message: string) {
  const id = crypto.randomUUID();
  toasts.push({ id, type, message });
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 5000);
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-up', colors[toast.type])}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-black/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
