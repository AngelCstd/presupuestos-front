'use client';

import Link from 'next/link';
import { Banner } from '@/components/layout/Banner';
import { useOpenPeriods } from '@/features/periods/hooks/useOpenPeriods';
import { todayInTimeZone } from '@/lib/domain/dates';
import { selectClosablePeriod } from '@/lib/domain/periods';
import { useTimezone } from '@/providers/TimezoneProvider';

/**
 * Visible en las cuatro tabs y en las pantallas de captura (TASK-front.md U14) — por
 * eso vive en el layout raíz, no en uno de nivel más bajo. Si hay varias vencidas,
 * ofrece cerrar solo la más antigua (§15.2 del contrato); no bloquea nada (§12.3).
 */
export function OverduePeriodBanner() {
  const timezone = useTimezone();
  const { data } = useOpenPeriods();

  if (!data) return null;

  const today = todayInTimeZone(timezone);
  const closable = selectClosablePeriod(data.data, today);

  if (!closable) return null;

  return (
    <Banner
      message="Tienes un periodo sin cerrar. Su dinero sigue apartado y no lo ves como disponible."
      action={
        <Link href={`/periodos/${closable.id}/cerrar`} className="text-sm font-medium text-primary underline">
          Cerrar periodo
        </Link>
      }
    />
  );
}
