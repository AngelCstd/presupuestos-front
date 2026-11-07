'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useCreateIncomeSource } from '@/features/accounts/hooks/useCreateIncomeSource';

export function CreateIncomeSourceForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const createIncomeSource = useCreateIncomeSource();

  return (
    <Sheet open={open} onClose={onClose} title="Nueva fuente de ingreso">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          createIncomeSource.mutate(
            { name },
            {
              onSuccess: () => {
                setName('');
                onClose();
              },
            },
          );
        }}
      >
        <Field label="Nombre">
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createIncomeSource.isPending}>
            Crear
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
