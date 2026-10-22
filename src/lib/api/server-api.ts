/**
 * Aggregador para el prefetch en Server Components (ARCHITECTURE-front.md §5):
 *
 *   await qc.prefetchQuery({ queryKey: qk.dashboard(null), queryFn: () => serverApi.getDashboard() });
 *
 * Reexporta las lecturas principales que cada pantalla necesita al primer render — no
 * es una capa nueva de lógica, solo una fachada ergonómica sobre los servicios reales
 * de cada `features/<dominio>/services/`. Las escrituras y lecturas secundarias se
 * importan directo del servicio correspondiente.
 */

import { listAccounts } from '@/features/accounts/services/accounts';
import { getDashboard } from '@/features/dashboard/services/insights';
import { listCategories } from '@/features/envelopes/services/categories';
import { listPeriods } from '@/features/periods/services/periods';
import { getMe } from '@/features/profile/services/profile';
import { listRecurringTemplates } from '@/features/recurring/services/recurring';
import { listTransactions } from '@/features/transactions/services/transactions';

export const serverApi = {
  getMe,
  getDashboard,
  getAccounts: listAccounts,
  getCategories: listCategories,
  getPeriods: listPeriods,
  getTransactions: listTransactions,
  getRecurringTemplates: listRecurringTemplates,
};
