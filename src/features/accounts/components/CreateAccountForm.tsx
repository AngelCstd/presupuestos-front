'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useCreateAccount } from '@/features/accounts/hooks/useCreateAccount';
import { es } from '@/lib/i18n/es';
import type { RealAccountKind } from '@/types/api';

const KIND_LABELS: Record<RealAccountKind, string> = {
  cash: es.kind.cash,
  credit: es.kind.credit,
  receivable: es.kind.receivable,
};

export function CreateAccountForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<RealAccountKind>('cash');
  const createAccount = useCreateAccount();

  return (
    <Sheet open={open} onClose={onClose} title={es.accountsView.newAccountTitle}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          createAccount.mutate(
            { name, kind },
            {
              onSuccess: () => {
                setName('');
                onClose();
              },
            },
          );
        }}
      >
        <Field label={es.accountsView.nameLabel}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={es.accountsView.namePlaceholder}
            required
          />
        </Field>

        <Field label={es.accountsView.kindLabel}>
          <div className="flex gap-2">
            {(Object.keys(KIND_LABELS) as RealAccountKind[]).map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={kind === option ? 'primary' : 'secondary'}
                onClick={() => setKind(option)}
              >
                {KIND_LABELS[option]}
              </Button>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createAccount.isPending}>
            {es.accountsView.createAction}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
