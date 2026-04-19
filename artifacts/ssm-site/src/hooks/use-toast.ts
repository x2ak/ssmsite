import { useState, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

let toastCount = 0;

// Simple in-memory toast store
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify() {
  listeners.forEach(l => l([...toasts]));
}

export function toast(options: Omit<Toast, 'id'>) {
  const id = `toast-${++toastCount}`;
  const newToast: Toast = { id, ...options };
  toasts = [...toasts, newToast];
  notify();

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, 4000);
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

  const subscribe = useCallback(() => {
    const handler = (updated: Toast[]) => setCurrentToasts(updated);
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  // Subscribe on mount
  useState(() => {
    return subscribe();
  });

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, []);

  return { toasts: currentToasts, toast, dismiss };
}
