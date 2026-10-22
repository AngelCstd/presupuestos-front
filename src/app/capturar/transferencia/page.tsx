'use client';

import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { SimpleTransactionForm } from '@/features/transactions/components/SimpleTransactionForm';
import type { CreateTransferRequest } from '@/types/api';

/**
 * Incluye el atajo "Pago de tarjeta" (origen cash, destino credit) — misma forma,
 * mismo endpoint. **Nunca** llama a /expenses aquí (SCREENS-front.md, TASK-front.md
 * U18): el gasto ya se contabilizó al comprar con la tarjeta.
 *
 * El título cambia solo a "Pago de tarjeta" cuando el destino elegido es `credit`
 * (2026-08-17, corrección pedida en revisión manual): sin esa señal, nadie busca un
 * pago de tarjeta bajo "Transferencia" — es la forma en que el usuario no termina
 * registrándolo como gasto por error, que es el error más común del dominio
 * (API-CONTRACT.md §11.3).
 */
export default function CapturarTransferenciaPage() {
  const { data: accounts } = useAccounts();

  const noEnoughAccounts = accounts && accounts.total < 2;

  return (
    <SimpleTransactionForm
      intent="transfers"
      draftIntent="transfer"
      title={(values) => {
        const destination = accounts?.data.find((account) => account.id === values.secondId);
        return destination?.kind === 'credit' ? 'Pago de tarjeta' : 'Transferencia';
      }}
      firstLabel="Origen"
      firstOptions={accounts?.data.map((account) => ({ id: account.id, name: account.name, kind: account.kind }))}
      secondLabel="Destino"
      secondOptions={accounts?.data.map((account) => ({ id: account.id, name: account.name, kind: account.kind }))}
      emptyState={noEnoughAccounts ? { tone: 'pendiente', title: 'Necesitas dos cuentas' } : null}
      buildBody={(values) =>
        ({
          bookedAt: values.bookedAt as CreateTransferRequest['bookedAt'],
          description: values.description,
          fromAccountId: values.firstId,
          toAccountId: values.secondId,
          amountCents: values.amountCents,
        }) satisfies CreateTransferRequest
      }
    />
  );
}
