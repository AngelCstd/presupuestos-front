import { redirect } from 'next/navigation';
import { TabBar } from '@/components/layout/TabBar';
import { listAccounts } from '@/features/accounts/services/accounts';

/**
 * Guard de onboarding: cero cuentas cash es la señal (API-CONTRACT.md §15.3 — no hay
 * flag). La decisión de sesión (¿hay usuario?) ya la tomó el middleware antes de
 * llegar aquí; este layout solo decide onboarding vs. no.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cashAccounts = await listAccounts({ kind: 'cash' });

  if (cashAccounts.total === 0) {
    redirect('/empezar');
  }

  return (
    <div className="pb-28">
      {children}
      <TabBar />
    </div>
  );
}
