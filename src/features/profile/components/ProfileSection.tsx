'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/states/Skeleton';
import { useMe } from '@/features/profile/hooks/useMe';
import { useUpdateTimezone } from '@/features/profile/hooks/useUpdateTimezone';
import { ApiError } from '@/lib/api/errors';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';

const TIMEZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];

export function ProfileSection() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const updateTimezone = useUpdateTimezone();

  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me && !selected) setSelected(me.timezone);
  }, [me, selected]);

  if (isLoading || !me) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{es.masView.emailLabel}</span>
        <span className="font-medium text-foreground">{me.email}</span>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted">{es.masView.timezoneLabel}</span>
          <span className="font-medium text-foreground">{me.timezone}</span>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform"
          >
            {es.masView.changeTimezoneAction}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2.5 rounded-lg border border-border/70 bg-muted-background/30 p-3 pt-2">
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>

          {error ? (
            <p role="alert" className="text-xs text-danger">
              {errorMessageFor(error)}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelected(me.timezone);
                setIsEditing(false);
              }}
            >
              {es.masView.cancelAction}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selected === me.timezone}
              onClick={() => setConfirming(true)}
            >
              {es.masView.saveTimezoneAction}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title={es.masView.timezoneDialogTitle}
        message={es.masView.timezoneDialogMessage}
        confirmLabel={es.masView.timezoneDialogConfirm}
        loading={updateTimezone.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setError(null);
          updateTimezone.mutate(selected, {
            onSuccess: () => {
              setConfirming(false);
              setIsEditing(false);
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
