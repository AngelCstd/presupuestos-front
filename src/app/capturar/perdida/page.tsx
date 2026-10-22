'use client';

import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { SimpleTransactionForm } from '@/features/transactions/components/SimpleTransactionForm';
import { es } from '@/lib/i18n/es';
import type { CreateLoanWriteOffRequest } from '@/types/api';

/**
 * Exige elegir un sobre — la API no crea una categoría de "Pérdidas"
 * (API-CONTRACT.md §15.5, SCREENS-front.md). No se ofrece crearla automáticamente
 * aquí: el usuario elige entre las que ya tiene, como cualquier otro sobre.
 */
export default function CapturarPerdidaPage() {
  const { data: receivableAccounts } = useAccounts({ kind: 'receivable' });
  const { data: categories } = useCategories(null);

  const withBalance = receivableAccounts?.data.filter((account) => account.balanceCents !== '0');
  const noneWithBalance = receivableAccounts && withBalance?.length === 0;

  return (
    <SimpleTransactionForm
      intent="loan-write-offs"
      draftIntent="loan-write-off"
      title={es.intent.loanWriteOff}
      firstLabel="Quién no te va a pagar"
      firstOptions={withBalance?.map((account) => ({ id: account.id, name: account.name }))}
      secondLabel={es.kind.category}
      secondOptions={categories?.data.map((category) => ({ id: category.id, name: category.name }))}
      emptyState={noneWithBalance ? { tone: 'exito', title: 'Nadie te debe nada' } : null}
      buildBody={(values) =>
        ({
          bookedAt: values.bookedAt as CreateLoanWriteOffRequest['bookedAt'],
          description: values.description,
          receivableAccountId: values.firstId,
          categoryId: values.secondId,
          amountCents: values.amountCents,
        }) satisfies CreateLoanWriteOffRequest
      }
    />
  );
}
