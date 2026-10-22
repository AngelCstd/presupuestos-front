'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { Skeleton } from '@/components/states/Skeleton';
import { useMe } from '@/features/profile/hooks/useMe';
import { useUpdateTimezone } from '@/features/profile/hooks/useUpdateTimezone';
import { ApiError } from '@/lib/api/errors';
import { errorMessageFor } from '@/lib/i18n/errors';

/**
 * `Intl.supportedValuesOf('timeZone')` es nativo (ECMA-402) — la lista real de zonas
 * IANA sin agregar ninguna dependencia (TASK-front.md U0: nada nuevo sin preguntar).
 */
const TIMEZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];

export function ProfileSection() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const updateTimezone = useUpdateTimezone();

  const [selected, setSelected] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me && !selected) setSelected(me.timezone);
  }, [me, selected]);

  if (isLoading || !me) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Correo">
        <p className="text-foreground">{me.email}</p>
      </Field>

      <Field label="Zona horaria">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessageFor(error)}
        </p>
      ) : null}

      <Button type="button" variant="secondary" disabled={selected === me.timezone} onClick={() => setConfirming(true)}>
        Guardar
      </Button>

      <ConfirmDialog
        open={confirming}
        title="Cambiar zona horaria"
        message="Esto cambia en qué periodo caen los gastos que captures a partir de ahora — el punto en que empieza y termina 'hoy' se mueve con la zona horaria."
        confirmLabel="Cambiar"
        loading={updateTimezone.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setError(null);
          updateTimezone.mutate(selected, {
            onSuccess: () => {
              setConfirming(false);
              router.refresh();
            },
            onError: (mutationError) => {
              setConfirming(false);
              setError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
            },
          });
        }}
      />
    </div>
  );
}
