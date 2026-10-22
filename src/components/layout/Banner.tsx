import type { ReactNode } from 'react';

export interface BannerProps {
  message: ReactNode;
  action?: ReactNode;
}

/**
 * Pieza genérica y presentacional — quién la muestra y cuándo (periodo vencido,
 * movimientos sin periodo) lo decide U14, con datos reales (ARCHITECTURE-front.md
 * §12). Este componente no sabe nada de dominio, solo pinta mensaje + acción.
 */
export function Banner({ message, action }: BannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted-background px-4 py-2 text-sm text-foreground">
      <p>{message}</p>
      {action}
    </div>
  );
}
