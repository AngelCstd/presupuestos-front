'use client';

import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { SimpleTransactionForm } from '@/features/transactions/components/SimpleTransactionForm';
import { es } from '@/lib/i18n/es';
import type { CreateLoanRequest } from '@/types/api';

export default function CapturarPrestamoPage() {
  const { data: cashAccounts } = useAccounts();
  const { data: receivableAccounts } = useAccounts({ kind: 'receivable' });

  const noReceivable = receivableAccounts && receivableAccounts.total === 0;

  return (
    <SimpleTransactionForm
      intent="loans"
      draftIntent="loan"
      title={es.intent.loan}
      firstLabel="Cuenta de origen"
      firstOptions={cashAccounts?.data
        .filter((account) => account.kind !== 'receivable')
        .map((account) => ({ id: account.id, name: account.name }))}
      secondLabel="A quién le prestas"
      secondOptions={receivableAccounts?.data.map((account) => ({ id: account.id, name: account.name }))}
      emptyState={noReceivable ? { tone: 'pendiente', title: "Crea una cuenta de 'te deben'" } : null}
      buildBody={(values) =>
        ({
          bookedAt: values.bookedAt as CreateLoanRequest['bookedAt'],
          description: values.description,
          fromAccountId: values.firstId,
          receivableAccountId: values.secondId,
          amountCents: values.amountCents,
        }) satisfies CreateLoanRequest
      }
    />
  );
}
