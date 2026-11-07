'use client';

import { useEffect } from 'react';
import { hideToast, useToastMessage } from '@/features/capture/stores/toastStore';

export function Toast() {
  const message = useToastMessage();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 inset-x-0 z-30 flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg transition-transform animate-in fade-in slide-in-from-bottom-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary shrink-0"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
