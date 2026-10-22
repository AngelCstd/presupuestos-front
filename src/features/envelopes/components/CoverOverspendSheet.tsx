'use client';

import { Button } from '@/components/ui/Button';
import { Money } from '@/components/money/Money';
import { Sheet } from '@/components/ui/Sheet';
import type { Category } from '@/types/api';

export interface CoverOverspendSheetProps {
  open: boolean;
  onClose: () => void;
  target: Category | null;
  categories: Category[];
  onCover: (fromCategoryId: string, amountCents: string) => void;
  moving?: boolean;
}

/**
 * Los orígenes son los sobres del mismo periodo con availableCents > 0, ordenados
 * descendente (TASK-front.md U17). Elegir uno mueve lo que haga falta para cubrir el
 * déficit — o todo lo disponible de ese sobre, lo que sea menor — vía
 * POST .../allocations/move.
 */
export function CoverOverspendSheet({
  open,
  onClose,
  target,
  categories,
  onCover,
  moving,
}: CoverOverspendSheetProps) {
  if (!target?.period) return null;

  const deficit = -BigInt(target.period.availableCents);
  const sources = categories
    .filter((category) => category.id !== target.id && category.period && BigInt(category.period.availableCents) > 0n)
    .sort((a, b) => Number(BigInt(b.period!.availableCents) - BigInt(a.period!.availableCents)));

  return (
    <Sheet open={open} onClose={onClose} title={`Cubrir sobregiro de ${target.name}`}>
      {sources.length === 0 ? (
        <p className="text-sm text-muted">No hay otro sobre con dinero disponible para mover.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((source) => {
            const available = BigInt(source.period!.availableCents);
            const amountToMove = available < deficit ? available : deficit;
            return (
              <li key={source.id} className="flex items-center justify-between gap-2">
                <span className="text-foreground">
                  {source.name} — <Money cents={source.period!.availableCents} />
                </span>
                <Button
                  type="button"
                  size="sm"
                  loading={moving}
                  onClick={() => onCover(source.id, amountToMove.toString())}
                >
                  Mover
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
