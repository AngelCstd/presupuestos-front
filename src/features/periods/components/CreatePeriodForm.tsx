'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useCreatePeriod } from '@/features/periods/hooks/useCreatePeriod';
import { ApiError } from '@/lib/api/errors';
import { errorMessageFor } from '@/lib/i18n/errors';
import type { CalendarDate, Period } from '@/types/api';

export function CreatePeriodForm({
  open,
  onClose,
  defaultStartsOn,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultStartsOn?: string;
  onCreated?: (period: Period) => void;
}) {
  const [startsOn, setStartsOn] = useState(defaultStartsOn ?? '');
  const [endsOn, setEndsOn] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const createPeriod = useCreatePeriod();

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo periodo">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          createPeriod.mutate(
            { startsOn: startsOn as CalendarDate, endsOn: endsOn as CalendarDate },
            {
              onSuccess: (period) => {
                setStartsOn('');
                setEndsOn('');
                onCreated?.(period);
                onClose();
              },
              onError: (error) => {
                setFormError(error instanceof ApiError ? error.code : 'INTERNAL_ERROR');
              },
            },
          );
        }}
      >
        <Field label="Empieza">
          <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required />
        </Field>
        <Field label="Termina">
          <Input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} required />
        </Field>
        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {errorMessageFor(formError)}
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createPeriod.isPending}>
            Crear
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
