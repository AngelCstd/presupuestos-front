'use client';

import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { SimpleTransactionForm } from '@/features/transactions/components/SimpleTransactionForm';
import { es } from '@/lib/i18n/es';
import type { CreateLoanRepaymentRequest } from '@/types/api';

export default function CapturarCobroPage() {
  const { data: cashAccounts } = useAccounts();
  const { data: receivableAccounts } = useAccounts({ kind: 'receivable' });

  const withBalance = receivableAccounts?.data.filter((account) => account.balanceCents !== '0');
  const noneWithBalance = receivableAccounts && withBalance?.length === 0;

  return (
    <SimpleTransactionForm
      intent="loan-repayments"
      draftIntent="loan-repayment"
      title={es.intent.loanRepayment}
      firstLabel="Quién te debe"
      firstOptions={withBalance?.map((account) => ({ id: account.id, name: account.name }))}
      secondLabel="Cuenta destino"
      secondOptions={cashAccounts?.data
        .filter((account) => account.kind !== 'receivable')
        .map((account) => ({ id: account.id, name: account.name }))}
      emptyState={noneWithBalance ? { tone: 'exito', title: 'Nadie te debe nada' } : null}
      buildBody={(values) =>
        ({
          bookedAt: values.bookedAt as CreateLoanRepaymentRequest['bookedAt'],
          description: values.description,
          receivableAccountId: values.firstId,
          toAccountId: values.secondId,
          amountCents: values.amountCents,
        }) satisfies CreateLoanRepaymentRequest
      }
    />
  );
}
