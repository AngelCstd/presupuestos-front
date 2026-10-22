'use client';

import Link from 'next/link';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { IncomeSourcesSection } from '@/features/accounts/components/IncomeSourcesSection';
import { SignOutButton } from '@/features/profile/components/SignOutButton';
import { es } from '@/lib/i18n/es';
import { ArchivedSection } from './ArchivedSection';

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md border border-border p-3">
      <span className="text-foreground">{label}</span>
      <span aria-hidden="true" className="text-muted">
        ›
      </span>
    </Link>
  );
}

export function MasView() {
  return (
    <div className="flex flex-col gap-8 p-4">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Perfil</h2>
        <ProfileSection />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Fuentes de ingreso</h2>
        <IncomeSourcesSection />
      </section>

      <section className="flex flex-col gap-2">
        <NavLink href="/cuentas" label="Cuentas" />
        <NavLink href="/periodos" label={`${es.entity.period}s`} />
        <NavLink href="/recordatorios" label="Recordatorios" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Archivadas</h2>
        <ArchivedSection />
      </section>

      {/* Adelantado fuera de orden desde antes de U23 (ver historial en PROGRESS.md):
          sin esto no hay manera de retomar una configuración inicial que quedó a
          medias. Se conserva ahora que /mas ya está completo. */}
      <Link href="/empezar" className="text-sm font-medium text-primary underline">
        Terminar configuración inicial
      </Link>

      <SignOutButton />
    </div>
  );
}
