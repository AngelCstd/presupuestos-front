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
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background"
    >
      {TABS.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              isActive ? 'text-primary font-medium' : 'text-muted',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
