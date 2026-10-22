'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * La zona horaria sale de GET /me, nunca del navegador (API-CONTRACT.md §4.2). Se lee
 * una vez en el layout raíz (Server Component) y se reparte por Context — cambia casi
 * nunca, así que ponerlo en props lo arrastraría por todo el árbol
 * (ARCHITECTURE-front.md §8.2).
 */
const TimezoneContext = createContext<string | null>(null);

export function TimezoneProvider({ timezone, children }: { timezone: string; children: ReactNode }) {
  return <TimezoneContext.Provider value={timezone}>{children}</TimezoneContext.Provider>;
}

export function useTimezone(): string {
  const timezone = useContext(TimezoneContext);
  if (timezone === null) {
    throw new Error('useTimezone: no hay TimezoneProvider en el árbol');
  }
  return timezone;
}
