'use client';

import { useSyncExternalStore } from 'react';

let currentToast: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function showToast(message: string) {
  currentToast = message;
  notify();
}

export function hideToast() {
  currentToast = null;
  notify();
}

export function useToastMessage(): string | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => currentToast,
    () => null,
  );
}
