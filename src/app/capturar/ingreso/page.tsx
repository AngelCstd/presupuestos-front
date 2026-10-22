'use client';

import Link from 'next/link';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useIncomeSources } from '@/features/accounts/hooks/useIncomeSources';
import { SimpleTransactionForm } from '@/features/transactions/components/SimpleTransactionForm';
import { es } from '@/lib/i18n/es';
import type { CreateIncomeRequest } from '@/types/api';

export default function CapturarIngresoPage() {
  const { data: accounts } = useAccounts();
  const { data: incomeSources } = useIncomeSources();

  const noSources = incomeSources && incomeSources.total === 0;

  return (
    <SimpleTransactionForm
      intent="incomes"
      draftIntent="income"
      title={es.intent.income}
      firstLabel="Cuenta"
      firstOptions={accounts?.data.map((account) => ({ id: account.id, name: account.name }))}
      secondLabel="Fuente de ingreso"
      secondOptions={incomeSources?.data.map((source) => ({ id: source.id, name: source.name }))}
      emptyState={
        noSources
          ? {
              tone: 'pendiente',
              title: 'Crea una fuente de ingreso',
              action: (
                <Link href="/mas" className="text-sm font-medium text-primary underline">
                  Ir a Más
                </Link>
              ),
            }
          : null
      }
      buildBody={(values) =>
        ({
          bookedAt: values.bookedAt as CreateIncomeRequest['bookedAt'],
          description: values.description,
          toAccountId: values.firstId,
          sourceId: values.secondId,
          amountCents: values.amountCents,
        }) satisfies CreateIncomeRequest
      }
    />
  );
}
