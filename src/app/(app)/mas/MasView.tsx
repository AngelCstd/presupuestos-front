'use client';

import Link from 'next/link';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useIncomeSources } from '@/features/accounts/hooks/useIncomeSources';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { IncomeSourcesSection } from '@/features/accounts/components/IncomeSourcesSection';
import { SignOutButton } from '@/features/profile/components/SignOutButton';
import { es } from '@/lib/i18n/es';
import { ArchivedSection } from './ArchivedSection';

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 transition-colors hover:border-border hover:bg-muted-background/30 shadow-sm"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span aria-hidden="true" className="text-muted text-base">
        ›
      </span>
    </Link>
  );
}

export function MasView() {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(null);
  const { data: incomeSources } = useIncomeSources();

  const isConfigIncomplete = Boolean(
    (accounts && accounts.data.filter((a) => a.kind === 'cash').length === 0) ||
    (categories && categories.data.length === 0) ||
    (incomeSources && incomeSources.data.length === 0),
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 min-w-0">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-foreground">{es.masView.title}</h1>
        <p className="text-xs text-muted">{es.masView.subtitle}</p>
      </header>

      {isConfigIncomplete ? (
        <section className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <span className="text-sm font-semibold text-foreground">
            {es.masView.incompleteSetupTitle}
          </span>
          <p className="text-xs text-muted">
            {es.masView.incompleteSetupDesc}
          </p>
          <Link
            href="/empezar"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 self-start mt-1"
          >
            {es.masView.finishSetupLink}
          </Link>
        </section>
      ) : null}

      {/* 1. Secciones de navegación frecuente */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.masView.navigationTitle}
        </h2>
        <div className="flex flex-col gap-2">
          <NavLink href="/cuentas" label={es.masView.accountsLink} />
          <NavLink href="/periodos" label={es.masView.periodsLink} />
          <NavLink href="/recordatorios" label={es.masView.recurringLink} />
        </div>
      </section>

      {/* 2. Fuentes de ingreso */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.masView.incomeSourcesTitle}
        </h2>
        <IncomeSourcesSection />
      </section>

      {/* 3. Configuración y cuenta (zona horaria colapsada) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.masView.configSectionTitle}
        </h2>
        <div className="rounded-xl border border-border/80 bg-background p-4 shadow-sm">
          <ProfileSection />
        </div>
      </section>

      {/* 4. Archivadas */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.masView.archivedTitle}
        </h2>
        <ArchivedSection />
      </section>

      <div className="pt-2" id="last-element">
        <SignOutButton />
      </div>
    </div>
  );
}
