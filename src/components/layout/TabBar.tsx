'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { es } from '@/lib/i18n/es';
import { cx } from '@/lib/ui/cx';

// Los 4 tabs de SCREENS-front.md Parte 2, etiquetas en lib/i18n/es.ts (es.nav).
const TABS = [
  { href: '/', label: es.nav.inicio },
  { href: '/sobres', label: es.nav.sobres },
  { href: '/movimientos', label: es.nav.movimientos },
  { href: '/mas', label: es.nav.mas },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 flex w-full border-t border-border bg-background/95 backdrop-blur-sm shadow-md"
    >
      {TABS.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'flex flex-1 flex-col items-center justify-center py-2.5 px-1 text-xs min-w-0 transition-colors',
              isActive ? 'text-primary font-medium' : 'text-muted hover:text-foreground',
            )}
          >
            <span className="truncate">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
