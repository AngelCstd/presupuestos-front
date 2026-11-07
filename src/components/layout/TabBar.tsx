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
          'flex flex-1 flex-col items-center justify-center py-1 text-2xs min-w-0 transition-colors gap-0.5',
          isInicio ? 'text-primary font-semibold' : 'text-muted hover:text-foreground',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="truncate">{es.nav.inicio}</span>
      </Link>

      {/* 2. Envelopes tab */}
      <Link
        href="/sobres"
        aria-current={isEnvelopes ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-2xs min-w-0 transition-colors gap-0.5',
          isEnvelopes ? 'text-primary font-semibold' : 'text-muted hover:text-foreground',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <span className="truncate">{es.nav.sobres}</span>
      </Link>

      {/* 3. Botón Central Hero Action: Capturar gasto (FAB Opción A) */}
      <div className="relative -top-3 flex flex-col items-center justify-center shrink-0 px-1">
        <Link
          href="/capturar/gasto"
          aria-label="Capturar un gasto"
          className="group flex flex-col items-center justify-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 border-4 border-background">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span className="text-2xs font-medium text-muted transition-colors group-hover:text-foreground mt-0.5">
            {es.nav.gasto}
          </span>
        </Link>
      </div>

      {/* 4. Movimientos */}
      <Link
        href="/movimientos"
        aria-current={isMovimientos ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-2xs min-w-0 transition-colors gap-0.5',
          isMovimientos ? 'text-primary font-semibold' : 'text-muted hover:text-foreground',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
        <span className="truncate">{es.nav.movimientos}</span>
      </Link>

      {/* 5. Más */}
      <Link
        href="/mas"
        aria-current={isMas ? 'page' : undefined}
        className={cx(
          'flex flex-1 flex-col items-center justify-center py-1 text-2xs min-w-0 transition-colors gap-0.5',
          isMas ? 'text-primary font-semibold' : 'text-muted hover:text-foreground',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
        </svg>
        <span className="truncate">{es.nav.mas}</span>
      </Link>
    </nav>
  );
}
