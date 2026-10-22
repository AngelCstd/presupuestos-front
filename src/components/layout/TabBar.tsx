'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { es } from '@/lib/i18n/es';
import { cx } from '@/lib/ui/cx';

export function TabBar() {
  const pathname = usePathname();

  const isInicio = pathname === '/';
  const isEnvelopes = pathname.startsWith('/sobres');
  const isMovimientos = pathname.startsWith('/movimientos');
  const isMas = pathname.startsWith('/mas');

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 w-full items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm shadow-md px-2"
    >
      {/* 1. Inicio tab */}
      <Link
        href="/"
        aria-current={isInicio ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-xs min-w-0 transition-colors',
          isInicio ? 'text-primary font-medium' : 'text-muted hover:text-foreground',
        )}
      >
        <span className="truncate">{es.nav.inicio}</span>
      </Link>

      {/* 2. Envelopes tab */}
      <Link
        href="/sobres"
        aria-current={isEnvelopes ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-xs min-w-0 transition-colors',
          isEnvelopes ? 'text-primary font-medium' : 'text-muted hover:text-foreground',
        )}
      >
        <span className="truncate">{es.nav.sobres}</span>
      </Link>

      {/* 3. Botón Central Hero Action: Capturar gasto (FAB Opción A) */}
      <div className="relative -top-4 flex shrink-0 items-center justify-center px-1">
        <Link
          href="/capturar/gasto"
          aria-label="Capturar un gasto"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 border-4 border-background"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Link>
      </div>

      {/* 4. Movimientos */}
      <Link
        href="/movimientos"
        aria-current={isMovimientos ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-xs min-w-0 transition-colors',
          isMovimientos ? 'text-primary font-medium' : 'text-muted hover:text-foreground',
        )}
      >
        <span className="truncate">{es.nav.movimientos}</span>
      </Link>

      {/* 5. Más */}
      <Link
        href="/mas"
        aria-current={isMas ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-xs min-w-0 transition-colors',
          isMas ? 'text-primary font-medium' : 'text-muted hover:text-foreground',
        )}
      >
        <span className="truncate">{es.nav.mas}</span>
      </Link>
    </nav>
  );
}
